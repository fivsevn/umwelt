// Keep the original files intact; each avatar is displayed from a 16px raster.
const pixelsBySource = new Map();
const imageStates = new WeakMap();
const selector = 'img[data-pixel-avatar]';

function rasterize(image) {
  const canvas = image.ownerDocument.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, 16, 16);
  return canvas.toDataURL('image/png');
}

export function pixelateAvatars(container) {
  for (const image of container.querySelectorAll(selector)) {
    const previous = imageStates.get(image);
    if (previous && (image.src === previous.source || image.src === previous.pixels)) continue;
    // A reused image may have changed source while its earlier load was pending.
    previous?.cleanup?.();
    let source;
    try {
      const url = new URL(image.src, image.ownerDocument.baseURI);
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== location.origin) continue;
      source = url.href;
    } catch { continue; }
    const state = {source};
    imageStates.set(image, state);
    const apply = pixels => {
      if (!pixels || imageStates.get(image) !== state || image.src !== source) return;
      state.pixels = pixels;
      image.src = pixels;
    };
    if (pixelsBySource.has(source)) {
      apply(pixelsBySource.get(source));
      continue;
    }
    const cleanup = () => {
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
      state.cleanup = undefined;
    };
    const failed = () => {
      cleanup();
      // Leave the existing source and any browser fallback untouched.
    };
    const loaded = () => {
      cleanup();
      if (image.src !== source || !image.naturalWidth || imageStates.get(image) !== state) return;
      try {
        const pixels = pixelsBySource.get(source) || rasterize(image);
        if (pixels) pixelsBySource.set(source, pixels);
        apply(pixels);
      } catch {
        // A failed decode or tainted canvas must not interrupt the feed.
      }
    };
    state.cleanup = cleanup;
    if (image.complete) {
      if (image.naturalWidth) loaded();
    } else {
      image.addEventListener('load', loaded, {once:true});
      image.addEventListener('error', failed, {once:true});
    }
  }
}
