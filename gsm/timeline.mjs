import {profiles, posts} from './data/feed.mjs';
import {createThreads} from './threads.mjs';
import {createStateStore} from './state.mjs';

export {likeIcon, commentIcon} from './icons.mjs';
export {postTime} from './time.mjs';
export {STORAGE_KEY, toggle} from './state.mjs';
export {pixelateAvatars} from './avatars.mjs';

export function openTimeline(storage) {
  return {profiles, posts, threads: createThreads(posts), stateStore: createStateStore(storage, Object.keys(profiles))};
}
