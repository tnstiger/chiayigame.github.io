<script setup>
import { useRoute } from "vue-router";
import { asset } from "../data/game.js";
const route = useRoute();
const links = [
  { path: "/", icon: "assets/img/nav-home.png", label: "首頁", active: ["home"] },
  {
    path: "/map",
    icon: "assets/img/nav-map.png",
    label: "地圖",
    active: ["map", "zone-intro", "clue", "scan", "question", "stamp"],
  },
  {
    path: "/stories",
    icon: "assets/img/nav-stories.png",
    label: "手帳",
    active: ["stories", "story-detail"],
  },
  {
    path: "/points",
    icon: "assets/img/nav-points.png",
    label: "集點",
    active: ["points", "reward"],
  },
];
</script>
<template>
  <nav class="footerNav" aria-label="主要選單">
    <RouterLink
      v-for="link in links"
      :key="link.path"
      :to="link.path"
      class="navBtn"
      :class="{ active: link.active.includes(route.name) }"
      ><img class="navIcon" :src="asset(link.icon)" alt="" />{{
        link.label
      }}</RouterLink
    >
  </nav>
</template>
