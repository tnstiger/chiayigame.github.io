<script setup>
import { zones, order } from "../data/game.js";
import { game, doneCount, resetGame } from "../store.js";
import { useRouter } from "vue-router";
import TopBar from "../components/TopBar.vue";
const router = useRouter();
function reset() {
  resetGame();
  router.replace("/");
}
</script>
<template>
  <section class="screen active">
    <TopBar to="/" label="← 回首頁" title="集點護照" />
    <div class="card pointSummary">
      <div class="questBadge">STAMPS</div>
      <h2 class="title" style="font-size: 30px">桃城百味集點頁</h2>
      <p class="subtitle">
        {{
          doneCount === 5
            ? "恭喜完成桃城百味集點任務！"
            : "完成展區任務即可獲得一枚特色印章。"
        }}
      </p>
      <div class="pointCount">{{ doneCount }}<small>/ 5 章</small></div>
      <div class="pointTrack">
        <span :style="{ width: (doneCount / 5) * 100 + '%' }"></span>
      </div>
      <div class="tiny">
        {{
          doneCount === 5
            ? "五章集滿！獎勵兌換資格已解鎖。"
            : `再完成 ${5 - doneCount} 個展區，就能集滿五章。`
        }}
      </div>
      <div class="stampGrid">
        <div
          v-for="id in order"
          :key="id"
          class="stampItem"
          :class="{ done: game.done[id] }"
        >
          <div class="stampCircle">
            <img :src="`/${zones[id].mapIcon}`" :alt="`${zones[id].name}集章圖案`" />
            <span v-if="game.done[id]" aria-label="已完成">✓</span>
          </div>
          <b>{{ zones[id].name }}</b>
        </div>
      </div>
      <div class="rewardBox">
        <h3>集滿五章可兌換</h3>
        <p>
          完成五個展區任務後，可憑集點頁至服務台兌換紀念小禮。此頁為 Demo
          的獎勵兌換參考。
        </p>
        <span class="rewardStatus">{{
          doneCount === 5 ? "已解鎖兌換資格" : "尚未集滿"
        }}</span>
      </div>
      <RouterLink v-if="doneCount === 5" class="primary" to="/reward"
        >查看完成回饋</RouterLink
      ><button class="ghostBtn" style="margin-top: 18px" @click="reset">
        重置 Demo 進度
      </button>
    </div>
  </section>
</template>
