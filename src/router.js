import { createRouter, createWebHistory } from "vue-router";
import { game } from "./store.js";
import { routeFallback } from "./progress.js";
import Home from "./views/Home.vue";
import CharacterSelect from "./views/CharacterSelect.vue";
import Dialogue from "./views/Dialogue.vue";
import Map from "./views/Map.vue";
import Clue from "./views/Clue.vue";
import Scan from "./views/Scan.vue";
import Question from "./views/Question.vue";
import Stamp from "./views/Stamp.vue";
import Stories from "./views/Stories.vue";
import StoryDetail from "./views/StoryDetail.vue";
import Points from "./views/Points.vue";
import Reward from "./views/Reward.vue";
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: Home },
    { path: "/select", name: "select", component: CharacterSelect },
    { path: "/intro", name: "intro", component: Dialogue },
    { path: "/tutorial", name: "tutorial", component: Dialogue },
    { path: "/map", name: "map", component: Map },
    { path: "/zone/:zone/intro", name: "zone-intro", component: Dialogue },
    { path: "/zone/:zone/clue", name: "clue", component: Clue },
    { path: "/zone/:zone/scene/:step?", name: "cutscene", component: Dialogue },
    { path: "/zone/:zone/scan/:mode/:number?", name: "scan", component: Scan },
    {
      path: "/zone/:zone/question/:number",
      name: "question",
      component: Question,
    },
    { path: "/zone/:zone/stamp", name: "stamp", component: Stamp },
    { path: "/stories", name: "stories", component: Stories },
    { path: "/stories/:id", name: "story-detail", component: StoryDetail },
    { path: "/points", name: "points", component: Points },
    { path: "/reward", name: "reward", component: Reward },
    { path: "/demo.html", redirect: "/" },
    { path: "/:pathMatch(.*)*", redirect: "/map" },
  ],
});
router.beforeEach((to) => routeFallback(to, game) || true);
