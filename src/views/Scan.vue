<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { zones, asset } from "../data/game.js";
import { game, foundTaoxi, finishQuestion, notify } from "../store.js";
import { scanner } from "../services/scanner.js";
import TopBar from "../components/TopBar.vue";
const route = useRoute(),
  router = useRouter(),
  id = route.params.zone,
  zone = zones[id];
const number = Number(route.params.number),
  isTaoxi = route.params.mode === "taoxi";
const video = ref(null),
  message = ref("準備好後，按下「啟動相機辨識」。"),
  canStart = ref(true),
  found = ref(false);
const photo = asset(
  isTaoxi ? zone.photo : zone.questions[number - 1].scanPhoto,
);
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
function success(event) {
  if (!alive || found.value || !running || event.detail?.source !== "mindar")
    return;
  found.value = true;
  scanner.stop();
  message.value = "掃描成功！";
  notify("掃描成功！已辨識到目標圖片");
  // Apply progress only after the display delay; leaving cancels both progress and navigation.
  timer = setTimeout(() => {
    if (!alive) return;
    if (isTaoxi) {
      foundTaoxi(id);
      router.replace(`/zone/${id}/question/1`);
    } else if (finishQuestion(id, number))
      router.replace(
        number === zone.questions.length
          ? `/zone/${id}/stamp`
          : `/zone/${id}/question/${number + 1}`,
      );
  }, 700);
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
      <div class="scanBg" :style="{ backgroundImage: `url(${photo})` }"></div>
      <div class="scanOverlay">
        <div class="scanTopHint" role="status">{{ message }}</div>
        <div class="scanFrame"></div>
        <img
          v-if="found"
          :src="asset('assets/img/img4.png')"
          class="arTaoxi"
          alt="桃喜 AR"
        /><button v-if="canStart" class="scanBtn" @click="start">
          啟動相機辨識
        </button>
      </div>
    </div>
    <div class="demoNote">
      將鏡頭對準目標圖片，辨識成功後會自動過關。請保持圖片完整、光線充足。此
      Demo 支援原有目標及桃喜 01、04、12、15、29，共六張目標圖片。
    </div>
  </section>
</template>
