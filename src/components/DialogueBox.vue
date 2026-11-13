<script setup>
import { computed } from "vue";
import { portraitImages, players, asset } from "../data/game.js";
import { game } from "../store.js";
const props = defineProps({
  item: Object,
  step: Number,
  total: Number,
  hint: String,
});
defineEmits(["previous", "next", "finish"]);
const isPlayer = computed(
  () => props.item.role === "player" || props.item.speaker === "MoMo醬",
);
const isNarrator = computed(() => props.item.role === "narrator");
const speakerName = computed(() =>
  props.item.speaker === "MoMo醬" ? "小幫手" : props.item.speaker,
);
const portrait = computed(() => {
  if (isPlayer.value && game.player) return players[game.player].image;
  return portraitImages[props.item.speaker] || portraitImages["小嘉博"];
});
</script>
<template>
  <div class="dialogueStage">
    <div v-if="!isNarrator" class="portraitWrap">
      <div>
        <img
          :src="asset(portrait)"
          :alt="speakerName + '立繪'"
          :class="{ playerPortrait: isPlayer && game.player }"
        />
        <div class="miniPortraitName">{{ speakerName }}</div>
      </div>
    </div>
    <div class="dialogueBox">
      <div class="dialogueHeader">
        <div class="speakerTag" :class="{ player: isPlayer }">
          {{ speakerName }}
        </div>
        <div class="dialogueStep">{{ step + 1 }} / {{ total }}</div>
      </div>
      <div class="dialogueText">{{ item.text }}</div>
      <div v-if="hint" class="dialogueHint">{{ hint }}</div>
      <div class="dialogueControls">
        <button
          class="secondary"
          :disabled="step === 0"
          @click="$emit('previous')"
        >
          上一句</button
        ><button v-if="step < total - 1" class="primary" @click="$emit('next')">
          下一句</button
        ><button v-else class="primary" @click="$emit('finish')">
          <slot>開始追蹤桃喜</slot>
        </button>
      </div>
    </div>
  </div>
</template>
