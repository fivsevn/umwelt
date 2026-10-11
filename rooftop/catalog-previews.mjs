// Paint only the visible shelf and yield between previews. A catalogue
// rebuild cancels old work, so searching cannot paint detached cards.
const thumbnailImages = new Map();
export async function paintCatalogThumbnail(canvas, relativePath) {
  const url = new URL(relativePath, import.meta.url);
  const revision = new URL(import.meta.url).searchParams.get('v');
  if (revision && !url.searchParams.has('v')) url.searchParams.set('v', revision);
  let ready = thumbnailImages.get(url.href);
  if (!ready) {
    const image = new Image();
    image.src = url.href;
    ready = image.decode().then(() => image);
    thumbnailImages.set(url.href, ready);
  }
  const image = await ready;
  if (!canvas.isConnected) return;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.imageSmoothingEnabled = false;
  c.drawImage(image, 0, 0, canvas.width, canvas.height);
  canvas.dataset.renderer = 'blender-preview';
  canvas.dataset.source = 'native-image';
}
export function createCatalogPreviews(root, paint, { busy = () => false } = {}) {
  let queue = [],
    frame = 0, running = false;
  const jobs = new WeakMap();
  async function next() {
    frame = 0;
    // Readback can wait; let selects, gestures and their scene transition finish.
    if (busy() || navigator.scheduling?.isInputPending?.()) {
      frame = requestAnimationFrame(next);
      return;
    }
    const job = queue.shift();
    running = true;
    try {
      if (job?.canvas.isConnected) await paint(job.sprite, job.canvas);
    } catch (error) {
      if (job?.canvas.isConnected) job.canvas.dataset.previewError = String(error.message || error);
    } finally {
      running = false;
      if (queue.length && !frame) frame = requestAnimationFrame(next);
    }
  }
  function enqueue(job) {
    queue.push(job);
    if (!frame && !running) frame = requestAnimationFrame(next);
  }
  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries)
              if (entry.isIntersecting) {
                const job = jobs.get(entry.target);
                observer.unobserve(entry.target);
                if (job) enqueue(job);
              }
          },
          { root, rootMargin: "96px" },
        )
      : null;
  return {
    reset() {
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      queue = [];
    },
    observe(canvas, sprite) {
      const job = { canvas, sprite };
      jobs.set(canvas, job);
      if (observer) observer.observe(canvas);
      else enqueue(job);
    },
  };
}
