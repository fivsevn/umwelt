export const STORAGE_KEY = 'umwelt-gsm-preview-v1';
export const freshState = () => ({version:1, likes:[], reposts:[], bookmarks:[], following:['pill','gecko'], posts:[], replies:{}});
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const strings = value => Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string'))] : [];
const validText = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 280;
export function readState(storage, authorIds) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!record(saved) || saved.version !== 1) return freshState();
    const state = freshState();
    for (const key of ['likes','reposts','bookmarks']) state[key] = strings(saved[key]);
    if (Array.isArray(saved.following)) state.following = strings(saved.following).filter(id => authorIds.includes(id) && id !== 'you');
    const ids = new Set();
    state.posts = (Array.isArray(saved.posts) ? saved.posts : []).filter(post => {
      if (!record(post) || typeof post.id !== 'string' || !/^local-[\w-]+$/.test(post.id) || ids.has(post.id) || !validText(post.text) || !Number.isFinite(post.createdAt)) return false;
      ids.add(post.id); return true;
    }).map(post => ({id:post.id, author:'you', text:post.text, createdAt:post.createdAt, topics:[], likes:0, reposts:0, replies:[]}));
    if (record(saved.replies)) state.replies = Object.fromEntries(Object.entries(saved.replies)
      .filter(([id, replies]) => /^[\w-]+$/.test(id) && Array.isArray(replies))
      .map(([id, replies]) => [id, replies.filter(reply => record(reply) && validText(reply.text)).map(reply => ({author:'you',text:reply.text}))]));
    return state;
  } catch { return freshState(); }
}
export function writeState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
export function toggle(state, key, id) {
  const exists = state[key].includes(id);
  state[key] = exists ? state[key].filter(value => value !== id) : [...state[key], id];
  return !exists;
}
