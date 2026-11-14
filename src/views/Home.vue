<script setup>
import { asset } from "../data/game.js";
</script>
<template>
  <section class="screen active homeScreen">
    <img
      :src="asset('assets/img/home-visual.webp')"
      class="homeVisual"
      alt="桃城百味主視覺：桃城百味，Savoring Chiayi，Real-World Game"
    /><RouterLink class="primary homeStart" to="/select">開始任務</RouterLink>
  </section>
</template>
