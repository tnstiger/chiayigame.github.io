<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  dialogueScript,
  tutorialScript,
  preludeScripts,
  cutsceneScripts,
  zones,
} from "../data/game.js";
import TopBar from "../components/TopBar.vue";
import DialogueBox from "../components/DialogueBox.vue";
const route = useRoute(),
  router = useRouter();
const zone = computed(() => route.params.zone);
const isTutorial = computed(() => route.name === "tutorial");
const isCutscene = computed(() => route.name === "cutscene");
const sceneStep = computed(() => Number(route.params.step ?? 0));
const script = computed(() =>
  isCutscene.value
    ? cutsceneScripts[zone.value][sceneStep.value]
    : zone.value
      ? preludeScripts[zone.value]
      : isTutorial.value
        ? tutorialScript
        : dialogueScript,
);
const view = computed(() => {
  if (isCutscene.value)
    return {
      back: "/map",
      backLabel: "← 回地圖",
      tag: zones[zone.value].name,
      title: zones[zone.value].storyTitle,
      hint: "",
      finishLabel: "前往謎題挑戰",
      next: `/zone/${zone.value}/question/${sceneStep.value + 1}`,
    };
  if (zone.value)
    return {
      back: "/map",
      backLabel: "← 回地圖",
      tag: zones[zone.value].name,
      title: zones[zone.value].storyTitle,
      hint: "點擊「下一句」，聽聽這一區的追蹤線索。",
      finishLabel: "開始追蹤桃喜",
      next: `/zone/${zone.value}/clue`,
    };
  if (isTutorial.value)
    return {
      back: "/intro",
      backLabel: "← 回開場故事",
      tag: "任務說明",
      title: "遊戲教學｜桃喜追蹤器",
      hint: "點擊「下一句」，了解如何使用桃喜追蹤器。",
      finishLabel: "開始追蹤！",
      next: "/map",
    };
  return {
    back: "/select",
    backLabel: "← 選擇角色",
    tag: "開場故事",
    title: "開頭｜桃喜大混亂",
    hint: "",
    finishLabel: "進入遊戲教學",
    next: "/tutorial",
  };
});
const step = computed(() =>
  Math.max(
    0,
    Math.min(script.value.length - 1, parseInt(route.query.line, 10) - 1 || 0),
  ),
);
function move(delta) {
  router.push({ path: route.path, query: { line: step.value + delta + 1 } });
}
</script>
<template>
  <section class="screen active">
    <TopBar :to="view.back" :label="view.backLabel" :title="view.tag" />
    <div class="card">
      <h2 class="title" style="font-size: 30px">{{ view.title }}</h2>
      <DialogueBox
        :item="script[step]"
        :step="step"
        :total="script.length"
        :hint="view.hint"
        @previous="move(-1)"
        @next="move(1)"
        @finish="router.push(view.next)"
        >{{ view.finishLabel }}</DialogueBox
      >
    </div>
  </section>
</template>
