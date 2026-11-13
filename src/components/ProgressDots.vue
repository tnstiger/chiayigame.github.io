<script setup>
import { order, zones } from "../data/game.js";
import { game } from "../store.js";
</script>
<template>
  <div class="bookTabs" aria-label="五區完成進度">
    <div
      v-for="id in order"
      :key="id"
      class="dot"
      :class="{ done: game.done[id] }"
      role="img"
      :aria-label="`${zones[id].name}${game.done[id] ? '已完成' : '未完成'}`"
    >
      <img :src="`/${zones[id].mapIcon}`" alt="" />
      <span v-if="game.done[id]" aria-hidden="true">✓</span>
    </div>
  </div>
</template>
