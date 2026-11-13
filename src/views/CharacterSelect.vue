<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { players, asset } from "../data/game.js";
import { game, setPlayer } from "../store.js";
import TopBar from "../components/TopBar.vue";
const router = useRouter();
const selected = ref(game.player);
function start() {
  if (!selected.value) return;
  setPlayer(selected.value);
  router.push("/intro");
}
</script>
<template>
  <section class="screen active">
    <TopBar to="/" label="← 回首頁" title="角色選擇" />
    <div class="card selectCard">
      <h2 class="title" style="font-size: 30px">
        成為<span class="pink">桃城小幫手</span>
      </h2>
      <p class="subtitle">
        今天，你將進入嘉義市立博物館，協助小嘉博找回遺失的筆記本，揭開藏在「桃城百味」裡的嘉義故事。
      </p>
      <h3 class="selectLabel" id="role-label">請選擇你的角色：</h3>
      <div class="roleGrid" role="radiogroup" aria-labelledby="role-label">
        <button
          v-for="(player, id) in players"
          :key="id"
          type="button"
          class="roleOption"
          :class="{ selected: selected === id }"
          role="radio"
          :aria-checked="selected === id"
          @click="selected = id"
        >
          <img :src="asset(player.image)" :alt="player.label" />
          <span>{{ player.label }}</span>
        </button>
      </div>
      <button
        type="button"
        class="primary"
        :disabled="!selected"
        @click="start"
      >
        開始冒險！
      </button>
    </div>
  </section>
</template>
