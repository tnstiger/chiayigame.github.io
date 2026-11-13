<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { asset } from "../data/game.js";
import { game, foundTaoxi, finishQuestion, notify } from "../store.js";
import { nextPath } from "../progress.js";
import { scanner } from "../services/scanner.js";
import TopBar from "../components/TopBar.vue";
const route = useRoute(),
  router = useRouter(),
  id = route.params.zone;
const number = Number(route.params.number),
  isTaoxi = route.params.mode === "taoxi";
const video = ref(null),
  message = ref("準備好後，按下「啟動相機辨識」。"),
  canStart = ref(true),
  found = ref(false);
let timer,
  alive = true,
  running = false;
async function start() {
  if (!alive || running || found.value) return;
  running = true;
  canStart.value = false;
  await scanner.start(video.value, (text, error) => {
    if (!alive) return;
    message.value = text;
    canStart.value = !!error;
    if (error) running = false;
  });
}
function complete() {
  found.value = true;
  canStart.value = false;
  scanner.stop();
  message.value = "掃描成功！";
  notify("掃描成功！已辨識到目標圖片");
  // Apply progress only after the display delay; leaving cancels both progress and navigation.
  timer = setTimeout(() => {
    if (!alive) return;
    if (isTaoxi) {
      foundTaoxi(id);
      router.replace(nextPath(id, 0));
    } else if (finishQuestion(id, number))
      router.replace(nextPath(id, number));
  }, 700);
}
function success(event) {
  if (!alive || found.value || !running || event.detail?.source !== "mindar")
    return;
  complete();
}
// Test shortcut: treat the scan as successful without the camera.
function skip() {
  if (!alive || found.value) return;
  complete();
}
onMounted(() => {
  if (game.pendingCameraStart === route.path) {
    game.pendingCameraStart = null;
    start();
  }
});
onBeforeUnmount(() => {
  alive = false;
  clearTimeout(timer);
  scanner.stop();
  game.pendingCameraStart = null;
});
</script>
<template>
  <section class="screen active">
    <TopBar
      :to="isTaoxi ? `/zone/${id}/clue` : `/zone/${id}/question/${number}`"
      label="←"
      :title="isTaoxi ? '掃描尋找桃喜' : '掃描展品'"
    />
    <div class="cameraShell">
      <video
        ref="video"
        autoplay
        muted
        playsinline
        class="hidden"
        @scanSuccess="success"
      ></video>
      <div class="scanOverlay">
        <div class="scanTopHint" role="status">{{ message }}</div>
        <div class="scanFrame"></div>
        <img
          v-if="found"
          :src="asset('assets/img/img4.png')"
          class="arTaoxi"
          alt="桃喜 AR"
        /><button v-if="canStart" class="scanBtn" @click="start">
          啟動相機辨識</button
        ><button v-if="!found" class="scanBtn testSkip" @click="skip">
          測試：略過掃描
        </button>
      </div>
    </div>
  </section>
</template>
