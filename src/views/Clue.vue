<script setup>
import { ref, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { zones, asset } from "../data/game.js";
import { game } from "../store.js";
import TopBar from "../components/TopBar.vue";
const route = useRoute(),
  router = useRouter(),
  id = route.params.zone,
  zone = zones[id];
const playing = ref(false);
let melody;
function scan() {
  const path = `/zone/${id}/scan/taoxi`;
  game.pendingCameraStart = path;
  router.push(path);
}
async function toggleMelody() {
  if (!melody) {
    melody = new Audio(asset(zone.mission.audio));
    melody.addEventListener("ended", () => (playing.value = false));
  }
  if (playing.value) {
    melody.pause();
    playing.value = false;
    return;
  }
  try {
    await melody.play();
    playing.value = true;
  } catch {
    playing.value = false;
  }
}
onBeforeUnmount(() => melody?.pause());
</script>
<template>
  <section class="screen active">
    <TopBar title="第 1 小關：尋找桃喜" />
    <div class="clueBox">
      <div class="scanBadge">🗺️ 地圖線索</div>
      <h2 class="clueTitle">
        {{ zone.mission ? zone.mission.title : `${zone.name}｜桃喜躲在哪裡？` }}
      </h2>
      <p v-if="zone.mission" class="clueText">
        <template v-for="(line, i) in zone.mission.text" :key="line"
          ><span class="preLine">{{ line }}</span
          ><template
            v-if="zone.mission.tip || i < zone.mission.text.length - 1"
            ><br /><br
          /></template>
        </template>
        <b v-if="zone.mission.tip">🔎 追蹤提示：{{ zone.mission.tip }}</b>
      </p>
      <p v-else class="clueText">
        「{{ zone.clue }}」<br /><span class="tiny">提示：{{ zone.hint }}</span>
      </p>
      <button
        v-if="zone.mission?.audio"
        class="secondary melodyBtn"
        @click="toggleMelody"
      >
        {{ playing ? "⏸ 暫停旋律" : "▶ 播放旋律" }}
      </button>
      <img class="scenePhoto" :src="asset(zone.photo)" alt="展場照片" /><button
        class="primary"
        @click="scan"
      >
        開始尋找桃喜</button
      ><RouterLink class="secondary" style="margin-top: 10px" to="/map"
        >換一區探索</RouterLink
      >
    </div>
  </section>
</template>
