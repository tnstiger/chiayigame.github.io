// Real MindAR image detection against controlled flat-image inputs (not phone-camera acceptance).
import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const manifest = JSON.parse(
  await readFile(
    new URL("../public/assets/targets/manifest.json", import.meta.url),
  ),
);
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
try {
  const page = await browser.newPage();
  await page.goto(process.env.COMPILER_BASE_URL || "http://127.0.0.1:4178");
  const results = await page.evaluate(async (manifest) => {
    const { Controller, Compiler } =
      await import("https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js");
    const buffer = await (
      await fetch("/assets/targets/targets.mind")
    ).arrayBuffer();
    const data = new Compiler().importData(buffer);
    if (data.length !== manifest.length)
      throw Error("Manifest/target count mismatch");
    const controller = new Controller({
      inputWidth: 640,
      inputHeight: 480,
      maxTrack: 1,
    });
    controller.addImageTargetsFromBuffer(buffer);
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    const results = [];
    try {
      for (const entry of manifest) {
        const single = new Compiler().importData(
          await (await fetch("/assets/targets/" + entry.file)).arrayBuffer(),
        );
        if (
          single.length !== 1 ||
          JSON.stringify(single[0]) !== JSON.stringify(data[entry.targetIndex])
        )
          throw Error("Individual target mismatch: " + entry.id);
        const img = new Image();
        img.src = "/assets/targets/" + entry.image;
        await img.decode();
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 640, 480);
        const scale = Math.min(600 / img.naturalWidth, 440 / img.naturalHeight);
        const w = img.naturalWidth * scale,
          h = img.naturalHeight * scale;
        ctx.drawImage(img, (640 - w) / 2, (480 - h) / 2, w, h);
        await controller.dummyRun(canvas);
        const { featurePoints } = await controller.detect(canvas);
        const matches = [];
        for (let index = 0; index < manifest.length; index++) {
          const { modelViewTransform } = await controller.match(
            featurePoints,
            index,
          );
          if (modelViewTransform) matches.push(index);
        }
        results.push({
          id: entry.id,
          targetIndex: entry.targetIndex,
          featurePoints: featurePoints.length,
          matches,
        });
      }
    } finally {
      controller.dispose();
      controller.worker.terminate();
    }
    return results;
  }, manifest);
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/real-mindar-targets.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(JSON.stringify(results, null, 2));
  if (
    results.some(
      (entry) =>
        entry.matches.length !== 1 || entry.matches[0] !== entry.targetIndex,
    )
  )
    throw Error("Recognition mismatch");
} finally {
  await browser.close();
}
