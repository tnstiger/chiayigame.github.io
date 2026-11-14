// The order matches public/assets/targets/targets.mind.
export const scanTargets = [
  { id: "taoxi-food", label: "桃喜 嘉義滋味" },
  { id: "taoxi-daily", label: "桃喜 城中日常" },
  { id: "taoxi-home", label: "桃喜 生活家屋" },
  { id: "taoxi-store", label: "桃喜 老店街" },
  { id: "taoxi-craft", label: "桃喜 百工巷" },
  { id: "food-douhua-level3", label: "嘉義滋味 豆漿豆花" },
  { id: "craft-wind-chicken-level3", label: "百工巷 管樂小雞刺繡" },
];

// `number` is the question route index; exhibition "第 3 小關" is question 2.
export function scanTargetFor(zone, mode, number) {
  const id =
    mode === "taoxi"
      ? `taoxi-${zone}`
      : mode === "object" && Number(number) === 2
        ? { food: "food-douhua-level3", craft: "craft-wind-chicken-level3" }[
            zone
          ]
        : null;
  return scanTargets.find((target) => target.id === id) || null;
}
