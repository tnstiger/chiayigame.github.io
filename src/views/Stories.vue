<script setup>
import { zones, order, extraStories, asset } from "../data/game.js";
import { game } from "../store.js";
import TopBar from "../components/TopBar.vue";
const diaryIcons = {
  food: "assets/img/diary01.png",
  daily: "assets/img/diary02.png",
  home: "assets/img/diary03.png",
  store: "assets/img/diary04.png",
  craft: "assets/img/diary05.png",
};
const wikiIcons = [
  "assets/img/wiki01.png",
  "assets/img/wiki02.png",
  "assets/img/wiki03.png",
  "assets/img/wiki04.png",
  "assets/img/wiki05.png",
];
</script>
<template>
  <section class="screen active">
    <TopBar title="支線小故事" />
    <h2 class="title" style="font-size: 30px">百味手帳</h2>
    <p class="subtitle">
      完成主線任務，解鎖百味手帳；小嘉博豆知識一開始就能閱讀。
    </p>
    <div class="storyGrid">
      <div class="storySection">百味手帳</div>
      <RouterLink
        v-for="id in order"
        :key="id"
        :to="game.done[id] ? `/stories/${id}` : '/stories'"
        class="storyCard"
        :class="{ locked: !game.done[id] }"
        :aria-disabled="!game.done[id]"
        @click="!game.done[id] && $event.preventDefault()"
        ><div class="storyIcon">
        <img
          :src="asset(diaryIcons[id])"
          :alt="`${zones[id].name}手帳圖示`"
        />
        <span v-if="!game.done[id]" aria-label="尚未解鎖">🔒</span>
        </div>
        <div>
          <b>{{ zones[id].storyTitle }}</b
          ><br /><span class="tiny"
            >百味手帳｜{{ zones[id].name }}｜{{
              game.done[id] ? "已解鎖" : "完成主線任務後解鎖"
            }}</span
          >
        </div></RouterLink
      >
      <div class="storySection">小嘉博豆知識</div>
      <RouterLink
        v-for="(story, index) in extraStories"
        :key="story.id"
        :to="`/stories/${story.id}`"
        class="storyCard"
        ><div class="storyIcon">
          <img
            :src="asset(wikiIcons[index])"
            :alt="`${story.storyTitle}豆知識圖示`"
          />
        </div>
        <div>
          <b>{{ story.storyTitle }}</b
          ><br /><span class="tiny">{{ story.name }}｜一開始即可閱讀</span>
        </div></RouterLink
      >
    </div>
  </section>
</template>
