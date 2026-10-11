export const OBSERVER_MESSAGES = Object.freeze({
  bird: "有小鸟盯着东东的多肉，像是想吃。",
  drone: "有一架无人机路过。",
});
export const observerIcon = id => '<span class="observer-icon" data-icon="' + id + '" aria-hidden="true"></span>';
export const NARRATIVE_LABELS = { bird: "经常啄多肉的小鸟", drone: "偶尔路过的无人机", neighbor: "？" };
export const STATION_ACTIONS = {
  bird: [["left", "向左沿檐", "left"], ["right", "向右沿檐", "right"]],
  drone: [["down", "下降", "down"], ["up", "上升", "up"], ["near", "靠近", "near"], ["far", "退远", "far"]],
  neighbor: [["out", "缩小倍率", "out"], ["in", "放大倍率", "in"]],
};
