<script setup>
import { zones, order } from "../data/game.js";
import { game, doneCount } from "../store.js";
import TopBar from "../components/TopBar.vue";
import ProgressDots from "../components/ProgressDots.vue";
const descriptions = {
  food: "涼麵與甜湯",
  daily: "中藥舖與醫館",
  home: "眷村客廳",
  store: "糖果店與老屋",
  craft: "製香與刺繡",
};
</script>
<template>
  <section class="screen active">
    <TopBar to="/" label="←" title="任務地圖" />
    <div class="questBadge">Quest Map</div>
    <h2 class="title" style="font-size: 30px">
      <span class="pink">桃喜</span>的百味手帳
    </h2>
    <ProgressDots />
    <div class="mapPanel">
      <div class="route"></div>
      <RouterLink
        v-for="id in order"
        :key="id"
        :to="`/zone/${id}/intro`"
        class="zone"
        :class="[`z-${id}`, { done: game.done[id] }]"
        ><img :src="`/${zones[id].mapIcon}`" :alt="`${zones[id].name}圖示`" /><span
          >{{ zones[id].name }}<small>{{ descriptions[id] }}</small></span
        ></RouterLink
      >
    </div>
    <div class="mapHint">
      📍 已找回 <b>{{ doneCount }} / 5</b> 頁《百味手帳》
    </div>
    <div v-if="doneCount === 5" class="completeNote">
      <p>經過一連串驚險又有趣的冒險，終於找回了所有遺失的【百味手帳】。</p>
      <p>
        從嘉義滋味、城中日常、眷村生活、老店街，到充滿職人故事的百工巷……
      </p>
      <p>每一本手帳裡，都藏著屬於嘉義的味道、記憶與故事。</p>
      <p class="tiny">（已完成集點，請至集點頁面查看）</p>
    </div>
    <div v-else class="zoneList">
      <RouterLink
        v-for="id in order"
        :key="id"
        :to="`/zone/${id}/intro`"
        class="zoneBtn"
        ><div class="zoneIcon" :class="{ done: game.done[id] }">
          <img :src="`/${zones[id].mapIcon}`" :alt="`${zones[id].name}圖示`" />
          <span v-if="game.done[id]" aria-label="已完成">✓</span>
        </div>
        <div class="zoneInfo">
          <b>{{ zones[id].name }}</b
          ><span>{{ zones[id].hint }}</span>
        </div>
        <div class="stampMini" :class="{ done: game.done[id] }">
          {{ game.done[id] ? "已找回" : "未完成" }}
        </div></RouterLink
      >
    </div>
  </section>
</template>
