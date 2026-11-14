<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { zones, asset } from "../data/game.js";
import { game, finishQuestion } from "../store.js";
import { nextPath } from "../progress.js";
import TopBar from "../components/TopBar.vue";
const route = useRoute(),
  router = useRouter(),
  id = route.params.zone,
  zone = zones[id],
  number = Number(route.params.number),
  question = zone.questions[number - 1];
const answer = ref(""),
  answers = ref(question.fields ? question.fields.map(() => "") : []),
  selected = ref(null),
  feedback = ref(""),
  accepted = ref(false),
  placed = ref([]),
  armed = ref(null),
  drag = ref(null),
  stage = ref(null);
const testControls = import.meta.env.DEV;
const pieces = question.pieces || [];
let timer,
  cancelDrag,
  alive = true;
function next() {
  if (!finishQuestion(id, number)) return;
  router.push(nextPath(id, number));
}
function result(correct) {
  if (accepted.value) return;
  accepted.value = correct;
  feedback.value = correct
    ? "✅ " + question.ok
    : "💡 再觀察一下展場線索，桃喜等你重試喔！";
  if (correct) timer = setTimeout(next, 750);
}
function choose(index) {
  if (!accepted.value) {
    selected.value = index;
    result(index === question.answer);
  }
}
function submit() {
  result(question.answer.includes(answer.value.replace(/\s/g, "")));
}
function submitMulti() {
  result(
    question.fields.every((field, index) =>
      field.answer.includes((answers.value[index] || "").replace(/\s/g, "")),
    ),
  );
}
function scan() {
  const path = `/zone/${id}/scan/object/${number}`;
  game.pendingCameraStart = path;
  router.push(path);
}
const STAGE_W = 620,
  STAGE_H = 500,
  SNAP_MARGIN = 14;
const percent = (value, total) => `${(value / total) * 100}%`;
function boxStyle(box, z) {
  return {
    left: percent(box.x, STAGE_W),
    top: percent(box.y, STAGE_H),
    width: percent(box.w, STAGE_W),
    height: percent(box.h, STAGE_H),
    zIndex: z,
  };
}
function place(item) {
  if (!placed.value.includes(item.id)) placed.value.push(item.id);
  armed.value = null;
  if (placed.value.length < pieces.length) {
    feedback.value = `✅ ${item.label}已固定！`;
    return;
  }
  accepted.value = true;
  feedback.value = "✅ " + question.ok;
  nextTick(() =>
    document
      .querySelector(".screen.active")
      ?.scrollTo({ top: 99999, behavior: "smooth" }),
  );
}
function tryPlace(id, clientX, clientY) {
  if (accepted.value || !stage.value) return;
  const item = pieces.find((p) => p.id === id),
    rect = stage.value.getBoundingClientRect(),
    x = ((clientX - rect.left) / rect.width) * STAGE_W,
    y = ((clientY - rect.top) / rect.height) * STAGE_H,
    box = item.box;
  const inside =
    x >= box.x - SNAP_MARGIN &&
    x <= box.x + box.w + SNAP_MARGIN &&
    y >= box.y - SNAP_MARGIN &&
    y <= box.y + box.h + SNAP_MARGIN;
  if (inside) place(item);
  else feedback.value = "💡 位置不對，換個地方試試看！";
}
function startDrag(event, item) {
  if (accepted.value) return;
  cancelDrag?.();
  const startX = event.clientX,
    startY = event.clientY;
  let moved = false;
  const move = (e) => {
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 6) moved = true;
    if (moved) drag.value = { id: item.id, x: e.clientX, y: e.clientY };
  };
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", stop);
    drag.value = null;
    cancelDrag = null;
  };
  const up = (e) => {
    stop();
    // A press without movement selects the piece, so tapping a spot on the house also works.
    if (moved) tryPlace(item.id, e.clientX, e.clientY);
    else armed.value = item.id;
  };
  cancelDrag = stop;
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", stop);
}
function stageClick(event) {
  if (armed.value) tryPlace(armed.value, event.clientX, event.clientY);
}
function autoSolve() {
  for (const item of pieces) if (!accepted.value) place(item);
}
const reveal = ref(0),
  canAskMotion = ref(false),
  motionPending = ref(false),
  manualReveal = ref(false),
  motionMessage = ref("");
let lastMagnitude = null,
  lastShake = 0;
function addReveal(amount) {
  if (accepted.value) return;
  reveal.value = Math.min(100, reveal.value + amount);
  if (reveal.value >= 100) {
    accepted.value = true;
    feedback.value = "✅ " + question.ok;
    nextTick(() =>
      document
        .querySelector(".screen.active")
        ?.scrollTo({ top: 99999, behavior: "smooth" }),
    );
  }
}
function onMotion(event) {
  const a = event.accelerationIncludingGravity;
  if (!a) return;
  const magnitude = Math.hypot(a.x || 0, a.y || 0, a.z || 0),
    now = Date.now();
  if (
    lastMagnitude !== null &&
    Math.abs(magnitude - lastMagnitude) > 10 &&
    now - lastShake > 120
  ) {
    lastShake = now;
    addReveal(8);
  }
  lastMagnitude = magnitude;
}
async function enableMotion() {
  if (motionPending.value || !alive) return;
  motionPending.value = true;
  try {
    const permission = await DeviceMotionEvent.requestPermission();
    if (!alive) return;
    if (permission === "granted") {
      window.addEventListener("devicemotion", onMotion);
      canAskMotion.value = false;
      motionMessage.value = "搖動感應已啟用，請搖動手機。也可以點按顯現照片。";
    } else {
      motionMessage.value = "未允許搖動感應，可改用點按顯現照片。";
    }
  } catch {
    if (alive) motionMessage.value = "無法啟用搖動感應，可改用點按顯現照片。";
  } finally {
    motionPending.value = false;
  }
}
onMounted(() => {
  if (question.type !== "shake") return;
  manualReveal.value = true;
  if (!("DeviceMotionEvent" in window)) {
    motionMessage.value = "此裝置不支援搖動感應，請點按顯現照片。";
    return;
  }
  if (typeof DeviceMotionEvent.requestPermission === "function")
    canAskMotion.value = true;
  else window.addEventListener("devicemotion", onMotion);
});
onBeforeUnmount(() => {
  alive = false;
  clearTimeout(timer);
  cancelDrag?.();
  window.removeEventListener("devicemotion", onMotion);
});
</script>
<template>
  <section class="screen active">
    <TopBar :title="zone.name + '｜' + question.stage" />
    <div class="card">
      <img
        :src="asset('assets/img/img5.png')"
        class="heroTaoxi"
        style="width: 110px; margin-top: -4px"
        alt="桃喜"
      />
      <div class="questionNum">{{ question.stage }}</div>
      <div class="question">{{ question.text }}</div>
      <div v-if="question.type === 'choice'" class="options">
        <button
          v-for="(option, index) in question.options"
          :key="option"
          class="opt"
          :class="{
            correct: selected !== null && index === question.answer,
            wrong: selected === index && index !== question.answer,
          }"
          :disabled="accepted"
          @click="choose(index)"
        >
          {{ option }}
        </button>
      </div>
      <form
        v-else-if="question.type === 'text'"
        class="inputRow"
        @submit.prevent="submit"
      >
        <input
          v-model="answer"
          class="answerInput"
          aria-label="請輸入答案"
          placeholder="請輸入答案"
          :disabled="accepted"
        /><button
          class="primary"
          style="width: auto; padding: 12px 18px"
          :disabled="accepted"
        >
          送出
        </button>
      </form>
      <form
        v-else-if="question.type === 'multitext'"
        @submit.prevent="submitMulti"
      >
        <div v-if="question.fields.some((f) => f.image)" class="emblemGrid">
          <figure
            v-for="field in question.fields.filter((f) => f.image)"
            :key="field.label"
          >
            <img :src="asset(field.image)" :alt="field.caption" />
            <figcaption>{{ field.caption }}</figcaption>
          </figure>
        </div>
        <div v-if="question.prompt" class="question">{{ question.prompt }}</div>
        <label
          v-for="(field, index) in question.fields"
          :key="field.label"
          class="fieldRow"
        >
          <span>{{ field.label }}：</span>
          <input
            v-model="answers[index]"
            class="answerInput"
            :aria-label="field.label"
            placeholder="請輸入答案"
            :disabled="accepted"
          />
        </label>
        <button class="primary" :disabled="accepted">送出</button>
      </form>
      <template v-else-if="question.type === 'shake'"
        ><div class="shakeBox">
          <img :src="asset(question.image)" alt="老屋模型結構圖" />
          <div class="shakeCover" :style="{ opacity: 1 - reveal / 100 }"></div>
        </div>
        <div class="tiny">顯現進度 {{ reveal }}%</div>
        <div v-if="motionMessage" class="tiny" role="status">
          {{ motionMessage }}
        </div>
        <button
          v-if="canAskMotion"
          class="secondary"
          :disabled="motionPending || accepted"
          @click="enableMotion"
        >
          啟用搖動感應</button
        ><button
          v-if="manualReveal"
          class="secondary"
          style="margin-top: 10px"
          :disabled="accepted"
          @click="addReveal(25)"
        >
          點按顯現照片</button
        ><button
          v-if="accepted"
          class="primary"
          style="margin-top: 10px"
          @click="next"
        >
          繼續
        </button></template
      ><template v-else-if="question.type === 'scan'"
        ><img
          v-if="question.image"
          :src="asset(question.image)"
          class="questionImage"
          alt="桃喜留下的圖片"
        />
        <div v-if="question.prompt" class="question">
          {{ question.prompt }}
        </div>
        <button class="primary" @click="scan">開始 AR 掃描</button></template
      ><template v-else-if="question.type === 'assemble'"
        ><template v-if="question.tips"
          ><div class="tiny tipsTitle">{{ question.tipsTitle }}</div>
          <ol class="tipsList">
            <li v-for="tip in question.tips" :key="tip">{{ tip }}</li>
          </ol></template
        >
        <div ref="stage" class="assembleStage" @click="stageClick">
          <img
            :src="asset(question.frame)"
            class="assembleFrame"
            alt="老屋木構架"
            draggable="false"
          />
          <img
            v-for="item in pieces.filter((p) => !placed.includes(p.id))"
            :key="'ghost-' + item.id"
            :src="asset(item.image)"
            class="assembleGhost"
            :style="boxStyle(item.box, 1)"
            alt=""
            draggable="false"
          />
          <img
            v-for="item in pieces.filter((p) => placed.includes(p.id))"
            :key="'placed-' + item.id"
            :src="asset(item.image)"
            class="assemblePlaced"
            :style="boxStyle(item.box, pieces.indexOf(item) + 2)"
            :alt="item.label"
            draggable="false"
          />
        </div>
        <div class="assembleTray">
          <button
            v-for="item in pieces.filter((p) => !placed.includes(p.id))"
            :key="item.id"
            type="button"
            class="assemblePiece"
            :class="{ armed: armed === item.id }"
            :aria-label="item.label + '零件'"
            @pointerdown.prevent="startDrag($event, item)"
            @keydown.enter.space.prevent="armed = item.id"
          >
            <img :src="asset(item.image)" alt="" draggable="false" />
            <span>{{ item.label }}</span>
          </button>
        </div>
        <button
          v-if="testControls"
          class="secondary"
          style="margin-top: 10px"
          :disabled="accepted"
          @click="autoSolve"
        >
          測試：自動完成拼圖</button
        ><button
          v-if="accepted"
          class="primary"
          style="margin-top: 10px"
          @click="next"
        >
          繼續
        </button></template
      >
      <img
        v-if="drag"
        class="dragGhost"
        :src="asset(pieces.find((p) => p.id === drag.id).image)"
        :style="{ left: drag.x + 'px', top: drag.y + 'px' }"
        alt=""
      />
      <div v-if="feedback" class="feedback" role="status">{{ feedback }}</div>
    </div>
  </section>
</template>
