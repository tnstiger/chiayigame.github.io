import { scanTargets } from "./scan-targets.js";

export function createScanner() {
  const MINDAR_URL =
    "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js";
  const TARGET_URL = "/assets/targets/targets.mind";
  let mindarModule;
  let controller;
  let targetBuffer;
  let preparation;
  let warmedController;
  let session;
  let drain = Promise.resolve();
  let resolveDrain;

  function releaseController() {
    if (!controller) return;
    controller.dispose();
    controller.worker.terminate();
    controller = null;
    warmedController = null;
  }

  function createController(Controller, width, height) {
    controller = new Controller({
      inputWidth: width,
      inputHeight: height,
      maxTrack: 1,
    });
    try {
      const { dimensions } = controller.addImageTargetsFromBuffer(targetBuffer);
      if (dimensions.length !== scanTargets.length) throw new Error();
    } catch {
      releaseController();
      targetBuffer = null;
      throw new Error("辨識檔格式不相容，請重新編譯目標圖片。");
    }
  }

  function prepare() {
    if (preparation) return preparation;
    preparation = (async () => {
      mindarModule ||= import(/* @vite-ignore */ MINDAR_URL).catch(() => {
        mindarModule = null;
        throw new Error("無法載入圖片辨識功能，請確認網路後重試。");
      });
      const download = targetBuffer
        ? Promise.resolve(targetBuffer)
        : fetch(TARGET_URL).then(async (response) => {
            if (!response.ok)
              throw new Error("無法載入辨識檔，請確認 targets.mind 存在。");
            return response.arrayBuffer();
          });
      const [module, buffer] = await Promise.all([mindarModule, download]);
      targetBuffer = buffer;
      createController(module.Controller, 640, 480);
      // Warm GPU kernels with a blank canvas. No camera permission or stream is requested.
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      await controller.dummyRun(canvas);
      warmedController = controller;
      return module;
    })().catch((error) => {
      releaseController();
      preparation = null;
      throw error;
    });
    return preparation;
  }

  function isCurrent(scan) {
    return session === scan && !scan.abort.signal.aborted;
  }

  function waitForVideo(video, signal) {
    return new Promise((resolve, reject) => {
      function cleanup() {
        video.removeEventListener("loadedmetadata", ready);
        video.removeEventListener("error", failed);
        signal.removeEventListener("abort", cancelled);
      }
      function ready() {
        cleanup();
        resolve();
      }
      function failed() {
        cleanup();
        reject(new Error("無法讀取相機影像"));
      }
      function cancelled() {
        cleanup();
        reject(new DOMException("Cancelled", "AbortError"));
      }
      if (signal.aborted) return cancelled();
      if (video.readyState >= 1 && video.videoWidth > 0) return ready();
      video.addEventListener("loadedmetadata", ready, { once: true });
      video.addEventListener("error", failed, { once: true });
      signal.addEventListener("abort", cancelled, { once: true });
    });
  }

  async function detectTarget(scan, onStatus) {
    let matches = 0;
    let previousTargetIndex = -1;
    try {
      while (isCurrent(scan) && !scan.found) {
        const { featurePoints } = await controller.detect(scan.video);
        if (!isCurrent(scan)) return;
        let matchedTargetIndex = -1;
        for (
          let targetIndex = 0;
          targetIndex < scanTargets.length;
          targetIndex++
        ) {
          const { modelViewTransform } = await controller.match(
            featurePoints,
            targetIndex,
          );
          if (!isCurrent(scan)) return;
          if (modelViewTransform) {
            matchedTargetIndex = targetIndex;
            break;
          }
        }
        matches =
          matchedTargetIndex === -1
            ? 0
            : matchedTargetIndex === previousTargetIndex
              ? matches + 1
              : 1;
        previousTargetIndex = matchedTargetIndex;
        if (matches >= 2) {
          scan.found = true;
          // Emit once after two image matches; this game needs recognition, not a tracked 3D pose.
          scan.video.dispatchEvent(
            new CustomEvent("scanSuccess", {
              bubbles: true,
              detail: {
                source: "mindar",
                targetIndex: matchedTargetIndex,
                targetId: scanTargets[matchedTargetIndex].id,
                targetLabel: scanTargets[matchedTargetIndex].label,
              },
            }),
          );
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    } catch (error) {
      if (isCurrent(scan)) {
        stop();
        onStatus("圖片辨識中斷，請重新啟動辨識。", true);
      }
    } finally {
      resolveDrain?.();
      resolveDrain = null;
    }
  }

  function stop() {
    const scan = session;
    session = null;
    if (scan) {
      scan.abort.abort();
      scan.stream?.getTracks().forEach((track) => track.stop());
      scan.video.pause();
      scan.video.srcObject = null;
      scan.video.classList.add("hidden");
    }
  }

  async function start(video, onStatus) {
    stop();
    const scan = {
      video,
      abort: new AbortController(),
      stream: null,
      found: false,
    };
    session = scan;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("請透過 HTTPS 或 localhost 開啟，才能使用相機辨識。");
      }
      onStatus("正在載入圖片辨識，請稍候…");
      const { Controller } = await prepare();
      if (!isCurrent(scan)) return;
      onStatus("請允許相機權限，並將鏡頭對準目標圖片。");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      if (!isCurrent(scan)) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      scan.stream = stream;
      video.srcObject = stream;
      await waitForVideo(video, scan.abort.signal);
      if (!isCurrent(scan)) return;
      await video.play();
      await drain;
      if (!isCurrent(scan)) return;
      // Reuse the controller across scans; wait for any pending image match before restarting.
      if (
        controller &&
        (controller.inputWidth !== video.videoWidth ||
          controller.inputHeight !== video.videoHeight)
      ) {
        releaseController();
      }
      if (!controller) {
        createController(Controller, video.videoWidth, video.videoHeight);
      }
      video.width = video.videoWidth;
      video.height = video.videoHeight;
      onStatus("正在準備辨識，請稍候…");
      if (warmedController !== controller) {
        await controller.dummyRun(video);
        warmedController = controller;
      }
      if (!isCurrent(scan)) return;
      video.classList.remove("hidden");
      onStatus("請將鏡頭對準目標圖片，辨識成功後會自動進入下一關。");
      drain = new Promise((resolve) => {
        resolveDrain = resolve;
      });
      void detectTarget(scan, onStatus);
    } catch (error) {
      if (!isCurrent(scan)) return;
      stop();
      const message =
        error.name === "NotAllowedError"
          ? "相機權限未開啟，請允許後重試。"
          : error.name === "NotFoundError"
            ? "找不到可用的相機，請改用有相機的裝置。"
            : error.message || "圖片辨識啟動失敗，請確認網路與相機後重試。";
      onStatus(message, true);
    }
  }

  return { start, stop, prepare };
}
export const scanner = createScanner();
window.addEventListener("pagehide", () => scanner.stop());
