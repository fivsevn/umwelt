// Paint only the visible shelf and yield between GPU previews. A catalogue
// rebuild cancels old work, so searching cannot paint detached cards.
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
