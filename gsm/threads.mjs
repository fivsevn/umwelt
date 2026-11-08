// Read-only discussion relationships; published post objects remain the source.
export function createThreads(posts = []) {
  const byId = new Map();
  for (const post of Array.isArray(posts) ? posts : []) {
    if (post && typeof post.id === 'string' && post.id && !byId.has(post.id)) byId.set(post.id, post);
  }

  const rootIds = new Map(), invalid = new Set();
  for (const id of byId.keys()) {
    if (rootIds.has(id)) continue;
    const trail = [], seen = new Set();
    let cursor = id, rootId = null, broken = false;
    while (true) {
      if (rootIds.has(cursor)) {
        broken = invalid.has(cursor);
        rootId = rootIds.get(cursor);
        break;
      }
      if (seen.has(cursor)) { broken = true; break; }
      seen.add(cursor);
      trail.push(cursor);
      const parentId = byId.get(cursor).replyTo;
      if (parentId === null || parentId === undefined) { rootId = cursor; break; }
      if (typeof parentId !== 'string' || !byId.has(parentId)) { broken = true; break; }
      cursor = parentId;
    }
    for (const item of trail) {
      rootIds.set(item, broken ? item : rootId);
      if (broken) invalid.add(item);
    }
  }

  // Invalid ancestry is isolated rather than attached to an unrelated discussion.
  const parents = new Map(), children = new Map(), comments = new Map();
  for (const [id, post] of byId) {
    children.set(id, []);
    if (!invalid.has(id) && post.replyTo !== null && post.replyTo !== undefined) parents.set(id, post.replyTo);
    const rootId = rootIds.get(id);
    if (rootId !== id) {
      if (!comments.has(rootId)) comments.set(rootId, []);
      comments.get(rootId).push(post);
    }
  }
  for (const [id, parentId] of parents) children.get(parentId).push(id);
  const timestamp = post => Number.isFinite(post.createdAt) ? post.createdAt : (Date.parse(post.date) || 0);
  for (const list of comments.values()) list.sort((a, b) => timestamp(a) - timestamp(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // Accumulate from leaves so even a long reply chain needs no recursion.
  const counts = new Map([...byId.keys()].map(id => [id, 0]));
  const remaining = new Map([...children].map(([id, list]) => [id, list.length]));
  const leaves = [...remaining].filter(([, count]) => count === 0).map(([id]) => id);
  for (let index = 0; index < leaves.length; index++) {
    const id = leaves[index], parentId = parents.get(id);
    if (parentId === undefined) continue;
    counts.set(parentId, counts.get(parentId) + counts.get(id) + 1);
    remaining.set(parentId, remaining.get(parentId) - 1);
    if (remaining.get(parentId) === 0) leaves.push(parentId);
  }

  return {
    byId,
    roots: [...byId.values()].filter(post => rootIds.get(post.id) === post.id),
    rootFor: id => byId.get(rootIds.get(id)) ?? null,
    parentFor: id => byId.get(parents.get(id)) ?? null,
    commentsFor: id => (comments.get(rootIds.get(id)) ?? []).slice(),
    countFor: id => counts.get(id) ?? 0
  };
}
