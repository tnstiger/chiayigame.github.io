import { zones, order, storyById, cutsceneScripts } from "./data/game.js";
export const storageKey = "taocityDemoStateV2";
export function normalizeProgress(value) {
  const done = {},
    journey = {};
  for (const id of order) {
    if (value?.done?.[id] === true) done[id] = true;
    const step = value?.journey?.[id];
    journey[id] = done[id]
      ? zones[id].questions.length + 1
      : Number.isInteger(step) &&
          step >= 0 &&
          step <= zones[id].questions.length
        ? step
        : 0;
  }
  return { done, journey };
}
export function nextPath(id, done) {
  if (done > 0 && done === zones[id].questions.length) return `/zone/${id}/stamp`;
  if (cutsceneScripts[id]?.[done])
    return done === 0 ? `/zone/${id}/scene` : `/zone/${id}/scene/${done}`;
  return `/zone/${id}/question/${done + 1}`;
}
export function routeFallback(to, progress) {
  if (["intro", "tutorial"].includes(to.name) && !progress.player)
    return "/select";
  const id = to.params.zone,
    number = Number(to.params.number);
  const intro = id && zones[id] ? `/zone/${id}/intro` : "/map";
  if (id && !zones[id]) return "/map";
  if (to.name === "cutscene") {
    const step = Number(to.params.step ?? 0);
    if (!Number.isInteger(step) || step < 0 || !cutsceneScripts[id]?.[step])
      return `/zone/${id}/question/${Number.isInteger(step) && step >= 0 ? step + 1 : 1}`;
    if ((progress.journey[id] || 0) < step + 1) return `/zone/${id}/clue`;
  }
  if (
    to.name === "question" ||
    (to.name === "scan" && to.params.mode === "object")
  ) {
    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > zones[id].questions.length
    )
      return intro;
    if ((progress.journey[id] || 0) < number) return `/zone/${id}/clue`;
    if (to.name === "scan" && zones[id].questions[number - 1].type !== "scan")
      return `/zone/${id}/question/${number}`;
  }
  if (to.name === "scan" && !["taoxi", "object"].includes(to.params.mode))
    return intro;
  if (to.name === "stamp" && !progress.done[id]) return intro;
  if (to.name === "reward" && !order.every((key) => progress.done[key]))
    return "/points";
  if (to.name === "story-detail") {
    const storyId = to.params.id;
    if (!storyById(storyId) || (zones[storyId] && !progress.done[storyId]))
      return "/stories";
  }
  return null;
}
