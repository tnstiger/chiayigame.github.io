import zones from "./zones.json" with { type: "json" };
import order from "./order.json" with { type: "json" };
import extraStories from "./extraStories.json" with { type: "json" };
import dialogueScript from "./dialogueScript.json" with { type: "json" };
import tutorialScript from "./tutorialScript.json" with { type: "json" };
import preludeScripts from "./preludeScripts.json" with { type: "json" };
import cutsceneScripts from "./cutsceneScripts.json" with { type: "json" };
import portraitImages from "./portraitImages.json" with { type: "json" };
export {
  zones,
  order,
  extraStories,
  dialogueScript,
  tutorialScript,
  preludeScripts,
  cutsceneScripts,
  portraitImages,
};
export const players = {
  boy: { label: "男生小幫手", image: "assets/img/player-boy.png" },
  girl: { label: "女生小幫手", image: "assets/img/player-girl.png" },
};
export const asset = (path) => `/${path}`;
export const storyById = (id) =>
  zones[id] || extraStories.find((story) => story.id === id);
