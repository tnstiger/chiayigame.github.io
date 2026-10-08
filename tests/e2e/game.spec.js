import { test, expect } from "@playwright/test";
const engine = `export class Controller {
 constructor(options){Object.assign(this,options);this.worker={terminate(){}}}
 addImageTargetsFromBuffer(buffer){if(!buffer.byteLength)throw Error('empty');return {dimensions:Array.from({length:5},()=>[600,969])}}
 async dummyRun(input){window.warmups=(window.warmups||0)+1;window.warmupInput=input.tagName}
 async detect(){window.detectionCount=(window.detectionCount||0)+1;return {featurePoints:[]}}
 async match(points,index){const target=window.alternateTargets ? window.detectionCount%2 : (window.recognizeIndex??0);return {modelViewTransform:window.recognize && index===target ? [[1]] : null}}
 dispose(){}
}`;
async function setup(page) {
  await page.route(
    "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js",
    (r) => r.fulfill({ contentType: "text/javascript", body: engine }),
  );
  await page.addInitScript(() => {
    window.cameraCalls = 0;
    window.cameraStreams = [];
    window.recognize = false;
    navigator.mediaDevices.getUserMedia = async () => {
      window.cameraCalls++;
      if (window.denyCamera)
        throw new DOMException("denied", "NotAllowedError");
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = 480;
      const ctx = c.getContext("2d");
      ctx.fillRect(0, 0, 640, 480);
      const stream = c.captureStream(10);
      window.cameraStreams.push(stream);
      const timer = setInterval(() => ctx.fillRect(0, 0, 640, 480), 100);
      const track = stream.getVideoTracks()[0],
        originalStop = track.stop.bind(track);
      track.stop = () => {
        clearInterval(timer);
        originalStop();
      };
      return stream;
    };
  });
}
async function scan(page) {
  await page.evaluate(() => {
    window.recognize = true;
  });
  if (await page.getByRole("button", { name: "啟動相機辨識" }).isVisible())
    await page.getByRole("button", { name: "啟動相機辨識" }).click();
}
for (const [targetIndex, targetId] of [
  "taoxi-food",
  "taoxi-daily",
  "taoxi-home",
  "taoxi-store",
  "taoxi-craft",
].entries()) {
  test(`recognizes ${targetId} and reports its own target index`, async ({
    page,
  }) => {
    await setup(page);
    await page.goto("/zone/food/scan/taoxi");
    await page.evaluate(
      ({ targetIndex }) => {
        window.recognizeIndex = targetIndex;
        window.scanResults = [];
        document.addEventListener("scanSuccess", (event) =>
          window.scanResults.push(event.detail),
        );
      },
      { targetIndex },
    );
    await scan(page);
    await expect(page).toHaveURL(/\/zone\/food\/question\/1$/);
    const results = await page.evaluate(() => window.scanResults);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      source: "mindar",
      targetIndex,
      targetId,
    });
  });
}
test("alternating targets cannot satisfy two consecutive matches", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/zone/food/scan/taoxi");
  await page.evaluate(() => {
    window.recognize = true;
    window.alternateTargets = true;
    window.scanResults = [];
    document.addEventListener("scanSuccess", (event) =>
      window.scanResults.push(event.detail),
    );
  });
  await page.getByRole("button", { name: "啟動相機辨識" }).click();
  await page.waitForFunction(() => window.detectionCount >= 6);
  await expect(page).toHaveURL(/scan\/taoxi$/);
  expect(await page.evaluate(() => window.scanResults)).toEqual([]);
  await page.evaluate(() => {
    window.alternateTargets = false;
    window.recognizeIndex = 4;
  });
  await expect(page).toHaveURL(/\/zone\/food\/question\/1$/);
  expect(await page.evaluate(() => window.scanResults)).toHaveLength(1);
});
test("indices outside the five active targets do not complete a scan", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/zone/food/scan/taoxi");
  await page.evaluate(() => {
    window.recognizeIndex = 5;
  });
  await scan(page);
  await page.waitForFunction(() => window.detectionCount >= 6);
  await expect(page).toHaveURL(/scan\/taoxi$/);
  await expect(page.locator(".scanTopHint")).not.toHaveText("掃描成功！");
  await page.evaluate(() => {
    window.recognizeIndex = 0;
  });
  await expect(page).toHaveURL(/\/zone\/food\/question\/1$/);
});
test("preparation does not open camera; navigation and direct routes restore correctly", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/");
  await page.waitForFunction(() => window.warmups > 0);
  expect(
    await page.evaluate(() => ({
      calls: window.cameraCalls,
      input: window.warmupInput,
    })),
  ).toEqual({ calls: 0, input: "CANVAS" });
  await page.getByRole("link", { name: "開始任務" }).click();
  await page.getByRole("button", { name: "下一句" }).click();
  await expect(page).toHaveURL(/line=2/);
  await page.goBack();
  await expect(page.locator(".dialogueStep")).toHaveText("1 / 6");
  await page.goto("/zone/food/intro?line=3");
  await page.reload();
  await expect(page.locator(".dialogueStep")).toHaveText("3 / 3");
  await page.getByRole("button", { name: "開始追蹤桃喜" }).click();
  await expect(page).toHaveURL(/\/zone\/food\/clue$/);
  await page.goto("/zone/food/question/2");
  await expect(page).toHaveURL(/\/zone\/food\/clue$/);
  await page.goto("/stories/food");
  await expect(page).toHaveURL(/\/stories$/);
  await page.goto("/reward");
  await expect(page).toHaveURL(/\/points$/);
  await page.goto("/zone/no-such-zone/clue");
  await expect(page).toHaveURL(/\/map$/);
  await page.goto("/demo.html");
  await expect(page).toHaveURL(/\/$/);
});
test("camera starts on request, wrong image stays scanning, exit cancels success and stops tracks", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/zone/food/scan/taoxi");
  await page.waitForFunction(() => window.warmups > 0);
  expect(await page.evaluate(() => window.cameraCalls)).toBe(0);
  await page.getByRole("button", { name: "啟動相機辨識" }).click();
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/scan\/taoxi$/);
  await page.evaluate(() => (window.recognize = true));
  await expect(page.locator(".scanTopHint")).toHaveText("掃描成功！");
  await page.getByRole("link", { name: "←", exact: true }).click();
  await page.waitForTimeout(900);
  await expect(page).toHaveURL(/clue$/);
  expect(
    await page.evaluate(() =>
      window.cameraStreams.every((s) =>
        s.getTracks().every((t) => t.readyState === "ended"),
      ),
    ),
  ).toBe(true);
  await page.goto("/zone/food/question/1");
  await expect(page).toHaveURL(/clue$/);
  await page.evaluate(() => (window.denyCamera = true));
  await page.getByRole("button", { name: "開始尋找桃喜" }).click();
  await expect(page.locator(".scanTopHint")).toContainText("相機權限未開啟");
});
test("five zone journeys award stamps once and unlock stories and rewards", async ({
  page,
}) => {
  test.setTimeout(60000);
  await setup(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const id of ["food", "daily", "home", "store", "craft"]) {
    await page.goto(`/zone/${id}/clue`);
    await page.getByRole("button", { name: "開始尋找桃喜" }).click();
    await scan(page);
    await expect(page).toHaveURL(new RegExp(`/zone/${id}/question/1$`));
    if (id === "craft") {
      await page.getByRole("textbox").fill("澳洲新山");
      await page.getByRole("button", { name: "送出" }).click();
    } else if (id === "store") {
      await page.getByRole("button", { name: "開始 AR 掃描" }).click();
      await scan(page);
    } else {
      await page.locator(".opt").first().click();
    }
    await expect(page).toHaveURL(new RegExp(`/zone/${id}/question/2$`));
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/zone/${id}/question/2$`));
    if (id === "daily") {
      await page.getByRole("textbox").fill("英安堂");
      await page.getByRole("button", { name: "送出" }).click();
    } else if (id === "store") {
      for (const part of ["屋頂", "窗框", "門面", "招牌"]) {
        await page
          .getByRole("button", { name: part + "零件", exact: true })
          .click();
        await page.getByRole("button", { name: part, exact: true }).click();
      }
    } else {
      await page.getByRole("button", { name: "開始 AR 掃描" }).click();
      await scan(page);
    }
    await expect(page).toHaveURL(new RegExp(`/zone/${id}/stamp$`));
  }
  await expect(page).toHaveURL(/\/reward$/);
  await page.getByRole("link", { name: "← 回集點頁" }).click();
  await expect(page.locator(".pointCount")).toContainText("5");
  await page.goto("/stories/food");
  await expect(page.locator(".bookPage h3")).toHaveText("嘉義涼麵的美味魔法！");
  expect(errors).toEqual([]);
});
