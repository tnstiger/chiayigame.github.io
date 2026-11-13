<script setup>
import { useRoute } from "vue-router";
import { zones } from "../data/game.js";
import TopBar from "../components/TopBar.vue";
const route = useRoute(),
  zone = zones[route.params.zone];
</script>
<template>
  <section class="screen active">
    <TopBar title="任務完成" />
    <div class="card stampCard">
      <img
        class="bigStamp"
        :src="`/${zone.mapIcon}`"
        :alt="`${zone.name}集章圖案`"
      />
      <h2>獲得《百味手帳》頁面 × 1</h2>
      <p class="subtitle">已解鎖「{{ zone.name }}」支線小故事。</p>
      <div class="unlockStory">
        <b>{{ zone.storyTitle }}</b
        ><br /><span class="tiny">{{ zone.story.slice(0, 70) }}……</span>
      </div>
      <RouterLink class="primary" style="margin-top: 16px" to="/stories"
        >查看支線小故事</RouterLink
      ><RouterLink class="secondary" style="margin-top: 10px" to="/map"
        >回地圖繼續找桃喜</RouterLink
      >
    </div>
  </section>
</template>
