// Run a local Vite server first, then: node scripts/compile-scan-targets.mjs
// Uses the official, fixed-version browser compiler and preserves the five mascot targets.
import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
const root = new URL("../public/assets/targets/", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("manifest.json", root), "utf8"),
).slice(0, 5);
const additions = [
  {
    id: "food-douhua-level3",
    label: "嘉義滋味 豆漿豆花",
    image: "food-douhua-level3.jpg",
  },
  {
    id: "craft-wind-chicken-level3",
    label: "百工巷 管樂小雞刺繡",
    image: "craft-wind-chicken-level3.jpg",
  },
];
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
try {
  const page = await browser.newPage();
  page.on("console", (m) => {
    if (m.text().startsWith("compile:")) console.log(m.text());
  });
  await page.goto(process.env.COMPILER_BASE_URL || "http://127.0.0.1:4178");
  const output = await page.evaluate(
    async ({ additions }) => {
      const { Compiler } =
        await import("https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js");
      const compiler = new Compiler();
      const original = compiler
        .importData(
          await (await fetch("/assets/targets/targets.mind")).arrayBuffer(),
        )
        .slice(0, 5);
      if (original.length !== 5)
        throw Error("Expected five existing mascot targets");
      const bytes = (data) => {
        compiler.data = data;
        const array = compiler.exportData();
        let text = "";
        for (let i = 0; i < array.length; i += 8192)
          text += String.fromCharCode(...array.subarray(i, i + 8192));
        return btoa(text);
      };
      const targets = [];
      const entries = [];
      for (const item of additions) {
        const image = new Image();
        image.src = "/assets/targets/" + item.image;
        await image.decode();
        // Keep the entire supplied reference image, limiting resolution only.
        const scale = Math.min(
          1,
          1024 / Math.max(image.naturalWidth, image.naturalHeight),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const [data] = await compiler.compileImageTargets(
          [canvas],
          (progress) =>
            console.log("compile:" + item.id + ":" + Math.floor(progress)),
        );
        const matching = data.matchingData.reduce(
          (n, x) => n + x.maximaPoints.length + x.minimaPoints.length,
          0,
        );
        const tracking = data.trackingData.reduce(
          (n, x) => n + x.points.length,
          0,
        );
        if (!matching || !tracking) throw Error("No features for " + item.id);
        targets.push(data);
        entries.push({
          ...item,
          targetIndex: original.length + targets.length - 1,
          file: item.id + ".mind",
          dimensions: [canvas.width, canvas.height],
          scaleCount: data.matchingData.length,
          matchingPoints: matching,
          trackingPoints: tracking,
          bytes: bytes([data]),
        });
      }
      const combined = bytes([...original, ...targets]);
      const imported = compiler.importData(
        Uint8Array.from(atob(combined), (c) => c.charCodeAt(0)).buffer,
      );
      if (imported.length !== 7) throw Error("Expected seven compiled targets");
      for (let i = 0; i < 5; i++)
        if (JSON.stringify(imported[i]) !== JSON.stringify(original[i]))
          throw Error("Original target changed: " + i);
      return { combined, entries };
    },
    { additions },
  );
  for (const { bytes, ...entry } of output.entries) {
    await writeFile(new URL(entry.file, root), Buffer.from(bytes, "base64"));
    manifest.push(entry);
  }
  await writeFile(
    new URL("targets.mind", root),
    Buffer.from(output.combined, "base64"),
  );
  await writeFile(
    new URL("manifest.json", root),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(JSON.stringify(manifest.slice(5), null, 2));
} finally {
  await browser.close();
}
