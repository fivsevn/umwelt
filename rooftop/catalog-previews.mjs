// Paint only the visible shelf and yield between GPU previews. A catalogue
// rebuild cancels old work, so searching cannot paint detached cards.
export function createCatalogPreviews(root, paint) {
  let queue = [],
    frame = 0;
  const jobs = new WeakMap();
  function next() {
    frame = 0;
    const job = queue.shift();
    try {
      if (job?.canvas.isConnected) paint(job.sprite, job.canvas);
    } finally {
      if (queue.length) frame = requestAnimationFrame(next);
    }
  }
  function enqueue(job) {
    queue.push(job);
    if (!frame) frame = requestAnimationFrame(next);
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
