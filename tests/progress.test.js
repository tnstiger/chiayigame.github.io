import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {
  zones,
  order,
  extraStories,
  dialogueScript,
  preludeScripts,
} from "../src/data/game.js";
import {
  normalizeProgress,
  routeFallback,
  nextPath,
} from "../src/progress.js";
test("migration retains client questions, answers and dialogue data", () => {
  const source = fs.readFileSync(
    new URL("../legacy/demo.html", import.meta.url),
    "utf8",
  );
  const code = source
    .slice(
      source.indexOf("const zones ="),
      source.indexOf("function updatePortrait"),
    )
    .replace(/let state=.*?;/, "")
    .replace(/const storeKey=.*?;/, "");
  const original = JSON.parse(
    JSON.stringify(
      vm.runInNewContext(code + ";({zones,order,extraStories,preludeScripts})"),
    ),
  );
  // Food was rewritten with the new story; every other zone must match the original.
  const ported = JSON.parse(JSON.stringify(zones));
  for (const zone of Object.values(ported)) {
    delete zone.mission;
    delete zone.mapIcon;
  }
  // Food's first question has new wording; its options, answer and feedback must still match.
  Object.assign(ported.food.questions[0], {
    stage: original.zones.food.questions[0].stage,
    text: original.zones.food.questions[0].text,
  });
  Object.assign(ported.food.questions[1], {
    text: original.zones.food.questions[1].text,
  });
  ported.food.story = original.zones.food.story;
  ported.daily.questions[0].text = original.zones.daily.questions[0].text;
  ported.daily.story = original.zones.daily.story;
  ported.home.questions = original.zones.home.questions;
  ported.home.story = original.zones.home.story;
  ported.store.questions = original.zones.store.questions;
  ported.store.story = original.zones.store.story;
  ported.craft.story = original.zones.craft.story;
  ported.craft.questions[0].text = original.zones.craft.questions[0].text;
  Object.assign(ported.craft.questions[1], {
    text: original.zones.craft.questions[1].text,
  });
  delete ported.craft.questions[1].image;
  delete ported.craft.questions[1].prompt;
  ported.daily.questions[1].text = original.zones.daily.questions[1].text;
  const portedExtras = JSON.parse(JSON.stringify(extraStories));
  for (const id of ["extra6", "extra7", "extra8", "extra9", "extra10"]) {
    const updated = portedExtras.find((s) => s.id === id);
    const old = original.extraStories.find((s) => s.id === id);
    updated.story = old.story;
    updated.storyTitle = old.storyTitle;
  }
  // Every zone's opening story has been rewritten, so only zones/stories are compared.
  const { preludeScripts: _original, ...originalRest } = original;
  assert.deepEqual(
    { zones: ported, order, extraStories: portedExtras },
    originalRest,
  );
  for (const id of order) assert.ok(preludeScripts[id].length > 0);
  assert.equal(dialogueScript.length, 15);
});
test("food cutscenes need the matching progress; zones without one skip to the question", () => {
  const scene = (zone, step) => ({ name: "cutscene", params: { zone, step } });
  const at = (n) => normalizeProgress({ journey: { food: n } });
  assert.equal(routeFallback(scene("food"), at(0)), "/zone/food/clue");
  assert.equal(routeFallback(scene("food"), at(1)), null);
  assert.equal(routeFallback(scene("food", "1"), at(1)), "/zone/food/clue");
  assert.equal(routeFallback(scene("food", "1"), at(2)), null);
  assert.equal(routeFallback(scene("food", "2"), at(2)), "/zone/food/question/3");
  assert.equal(
    routeFallback(
      scene("craft", "1"),
      normalizeProgress({ journey: { craft: 1 } }),
    ),
    "/zone/craft/clue",
  );
  assert.equal(
    routeFallback(
      scene("craft", "1"),
      normalizeProgress({ journey: { craft: 2 } }),
    ),
    null,
  );
});
test("nextPath inserts cutscenes between steps and ends at the stamp", () => {
  assert.equal(nextPath("food", 0), "/zone/food/scene");
  assert.equal(nextPath("food", 1), "/zone/food/scene/1");
  assert.equal(nextPath("food", 2), "/zone/food/stamp");
  assert.equal(nextPath("daily", 0), "/zone/daily/scene");
  assert.equal(nextPath("daily", 1), "/zone/daily/scene/1");
  assert.equal(nextPath("daily", 2), "/zone/daily/stamp");
  assert.equal(nextPath("home", 0), "/zone/home/scene");
  assert.equal(nextPath("home", 1), "/zone/home/scene/1");
  assert.equal(nextPath("home", 2), "/zone/home/stamp");
  assert.equal(nextPath("store", 0), "/zone/store/scene");
  assert.equal(nextPath("store", 1), "/zone/store/scene/1");
  assert.equal(nextPath("store", 2), "/zone/store/stamp");
  assert.equal(nextPath("craft", 0), "/zone/craft/scene");
  assert.equal(nextPath("craft", 1), "/zone/craft/scene/1");
  assert.equal(nextPath("craft", 2), "/zone/craft/stamp");
});
test("intro and tutorial require a chosen role", () => {
  for (const name of ["intro", "tutorial"]) {
    const to = { name, params: {} };
    assert.equal(routeFallback(to, normalizeProgress({})), "/select");
    assert.equal(
      routeFallback(to, { ...normalizeProgress({}), player: "girl" }),
      null,
    );
  }
});
test("legacy completed stamps survive; invalid saved values cannot grant progress", () => {
  const p = normalizeProgress({
    done: { food: true, daily: "true" },
    journey: { home: 999, craft: -1, store: "2" },
  });
  assert.equal(p.done.food, true);
  assert.equal(p.journey.food, 3);
  assert.equal(p.done.daily, undefined);
  assert.equal(p.journey.home, 0);
  assert.equal(p.journey.craft, 0);
  assert.equal(p.journey.store, 0);
});
test("direct links do not award stamps, bypass scanning or unlock stories", () => {
  const p = normalizeProgress({});
  assert.equal(
    routeFallback(
      { name: "question", params: { zone: "food", number: "1" } },
      p,
    ),
    "/zone/food/clue",
  );
  assert.equal(
    routeFallback({ name: "stamp", params: { zone: "food" } }, p),
    "/zone/food/intro",
  );
  assert.equal(routeFallback({ name: "reward", params: {} }, p), "/points");
  assert.equal(
    routeFallback({ name: "story-detail", params: { id: "food" } }, p),
    "/stories",
  );
  assert.equal(
    routeFallback({ name: "story-detail", params: { id: "extra6" } }, p),
    null,
  );
});
test("invalid zones, stages and scan modes fall back safely", () => {
  const p = normalizeProgress({ done: { food: true, daily: true } });
  assert.equal(
    routeFallback(
      { name: "question", params: { zone: "missing", number: "1" } },
      p,
    ),
    "/map",
  );
  assert.equal(
    routeFallback(
      { name: "question", params: { zone: "food", number: "99" } },
      p,
    ),
    "/zone/food/intro",
  );
  assert.equal(
    routeFallback(
      { name: "scan", params: { zone: "daily", mode: "object", number: "2" } },
      p,
    ),
    "/zone/daily/question/2",
  );
});
