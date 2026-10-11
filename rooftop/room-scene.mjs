export const ROOM_LAYOUT = [];
// Native Blender render shares the actual floor coordinates with the fallback
// actors and placement canvas. Pixelorama authored the same room atlas.
let roomImage = null;
const readyListeners = new Set();
export function onRoomBackgroundReady(callback) {
  if (roomImage?.complete && roomImage.naturalWidth) queueMicrotask(callback);
  else readyListeners.add(callback);
  return () => readyListeners.delete(callback);
}
export function paintRoomBase(c) {
  if (!roomImage && typeof Image !== "undefined") {
    roomImage = new Image();
    roomImage.addEventListener("load", () => {
      for (const callback of readyListeners) callback();
      readyListeners.clear();
    }, { once: true });
    const url = new URL("./assets/room/room-background-2d.png", import.meta.url);
    const revision = new URL(import.meta.url).searchParams.get("v");
    if (revision) url.searchParams.set("v", revision);
    roomImage.src = url.href;
  }
  c.fillStyle = "#a9b1a9";
  c.fillRect(0, 0, 640, 520);
  if (roomImage?.complete && roomImage.naturalWidth) c.drawImage(roomImage, 0, 0, 640, 520);
}
