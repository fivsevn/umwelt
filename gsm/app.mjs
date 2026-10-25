import {gameDocumentTitle, desktopLanguage} from '../shared/games.mjs';
import {profiles, posts as seeds} from './data/feed.mjs';
import {copy} from './locales.mjs';
import {likeIcon} from './icons.mjs';
import {postTime} from './time.mjs';
import {freshState, readState, writeState, toggle} from './state.mjs';
import {decoration} from './decorations.mjs';
import {handsetThemes, handsetNames as shellNames, handsetById} from './handsets.mjs';
import {pixelateAvatars} from './avatars.mjs';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isSettings = document.body.dataset.view === 'settings';
let language = desktopLanguage(), storage, toastTimer;
const shellAliases = new Map([['mint','leopard'],['blue','tokay'],['berry','day'],['blizzard','stone']]);
const normalizeShell = value => shellNames.includes(value) ? value : shellAliases.get(value);
const shellStorageKey = 'umwelt-gsm-shell';
let shell = 'leopard', savedShell;
try { storage = window.localStorage; } catch {}
function readSavedShell() {
  let stored;
  try { stored = storage?.getItem(shellStorageKey); } catch { return; }
  const normalized = normalizeShell(stored);
  if (normalized && stored !== normalized) {
    try { storage.setItem(shellStorageKey,normalized); } catch {}
  }
  return normalized;
}
savedShell = readSavedShell();
if (savedShell) shell = savedShell;
const requestedShell = normalizeShell(new URLSearchParams(location.search).get('shell'));
const restoredNavigation = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
if (shellNames.includes(requestedShell) && !(restoredNavigation && shellNames.includes(savedShell))) {
  shell = requestedShell;
  try { storage?.setItem(shellStorageKey,shell); } catch {}
}
function applyShell() {
  document.documentElement.dataset.shell = shell;
  document.documentElement.style.setProperty('--key-ink',handsetById[shell].ink);
  document.querySelector('[data-shell-art-wide]').srcset = new URL(`./assets/handset-${shell}-wide.webp`,import.meta.url).href;
  document.querySelector('[data-shell-art]').src = new URL(`./assets/handset-${shell}.webp`,import.meta.url).href;
  // Keep history entries consistent with the cover restored on back/forward.
  const url = new URL(location.href);
  url.searchParams.delete('shell');
  if (shell !== 'leopard') url.searchParams.set('shell',shell);
  if (url.href !== location.href) history.replaceState(null,'',url);
  document.querySelector('meta[name="theme-color"]').content = handsetById[shell].color;
  document.querySelectorAll('[data-shell-choice]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.shellChoice === shell)));
  // Preserve a preview choice and storage-denied sessions through both pages.
  for (const [id,path] of [['streamButton',isSettings?'../':'./'],['settingsButton',isSettings?'./':'./settings/']]) {
    document.getElementById(id).href = shell === 'leopard' ? path : `${path}?shell=${shell}`;
  }
}
if (isSettings) {
  $('.shell-options').innerHTML = handsetThemes.map(({id,labelKey})=>{
    const title=copy[language][labelKey] ?? copy.zh[labelKey];
    return `<button type="button" class="shell-option" data-shell-choice="${id}" aria-pressed="false" aria-label="${escape(title)}"><span class="mini-phone" aria-hidden="true"><span class="mini-pattern" data-mini-shell="${id}"></span></span><span data-shell-name="${id}">${escape(title)}</span></button>`;
  }).join('');
}
applyShell();
document.querySelectorAll('[data-mini-shell]').forEach(element => { element.innerHTML = `<img src="${new URL(`./assets/handset-${element.dataset.miniShell}-thumb.webp`,import.meta.url).href}" alt="" loading="lazy" decoding="async">`; });
// Keep earlier local records intact; published packages are the timeline source.
const state = storage ? readState(storage, Object.keys(profiles)) : freshState();
const allPosts = seeds;
const localized = value => typeof value === 'string' ? value : value[language] ?? value.zh;
const t = (key, vars = {}) => Object.entries(vars).reduce((value,[name,replacement]) => value.replace(`{${name}}`, replacement), copy[language][key]);

function timeLabel(post) {
  return postTime(post,language);
}
function likeContent(post) {
  return `${likeIcon()}<span class="like-count">${post.likes+Number(state.likes.includes(post.id))}</span>`;
}
function likeLabel(post) {
  return `${t(state.likes.includes(post.id)?'unlike':'like')} · ${localized(profiles[post.author].name)} · ${post.likes+Number(state.likes.includes(post.id))}`;
}
function postMarkup(post) {
  const profile = profiles[post.author];
  const blocks = localized(post.blocks);
  return `<article class="post" data-post-id="${post.id}" data-tone="${profile.color}">
    <div class="post-content bubble">
      <header class="post-identity"><span class="avatar" aria-hidden="true"><img data-pixel-avatar src="${new URL(profile.avatarImage,import.meta.url).href}" width="16" height="16" alt="" decoding="async"></span><span class="author-name"><span class="author-label">${escape(localized(profile.name))}</span><span class="author-handle">@${escape(profile.handle)}</span></span></header>
      ${blocks.map(block=>block.type==='image'?`<figure class="post-media"><img src="${new URL(block.src,import.meta.url).href}" width="${block.width}" height="${block.height}" alt="${escape(block.alt)}" loading="lazy"></figure>`:`<p class="post-text">${escape(block.text)}</p>`).join('')}
      <footer class="post-footer">
        <time class="post-time" datetime="${post.date}" title="${escape(new Date(post.createdAt).toLocaleString({zh:'zh-CN',en:'en-GB',ja:'ja-JP'}[language],{timeZone:'Asia/Shanghai'}))}">${timeLabel(post)}</time>
        <div class="post-actions"><button type="button" id="like-${post.id}" data-like="${post.id}" aria-pressed="${state.likes.includes(post.id)}" aria-label="${escape(likeLabel(post))}">${likeContent(post)}</button></div>
      </footer>
    </div>
  </article>`;
}
// Feedback decorates the existing like state; it never writes its own record.
const likeFeedback = new WeakMap();
function clearLikeFeedback(button) {
  const feedback = likeFeedback.get(button);
  if (feedback) {
    clearTimeout(feedback.timer);
    feedback.burst.remove();
    likeFeedback.delete(button);
  }
  button.classList.remove('is-celebrating');
}
function celebrateLike(button) {
  clearLikeFeedback(button);
  const burst = document.createElement('span');
  burst.className = 'like-burst';
  burst.setAttribute('aria-hidden','true');
  for (const [dx,dy] of [[-12,-14],[11,-17],[-17,-2],[16,-3]]) {
    const pixel = document.createElement('span');
    pixel.style.setProperty('--dx',`${dx}rem`);
    pixel.style.setProperty('--dy',`${dy}rem`);
    burst.append(pixel);
  }
  button.closest('.post-actions').append(burst);
  button.classList.add('is-celebrating');
  const timer = setTimeout(()=>clearLikeFeedback(button),650);
  likeFeedback.set(button,{burst,timer});
}

function render() {
  const activeId = document.activeElement?.id;
  document.documentElement.lang = {zh:'zh-CN',en:'en',ja:'ja'}[language];
  document.title = (isSettings?t('settings')+' · ':'')+gameDocumentTitle('gsm',language);
  $('[data-home]').setAttribute('aria-label',t('homeLink'));
  $('[data-home]').title = t('homeLink');
  $('[data-skip]').textContent = isSettings?t('settings'):t('skip');
  $('#settingsButton').setAttribute('aria-label',t('settings'));
  $('#settingsButton').title = t('settings');
  $('#mainNav').setAttribute('aria-label',t('navigation'));
  if (isSettings) {
    $('#settingsTitle').textContent = t('settings');
    $('[data-shell-label]').textContent = t('shellLabel');
    for (const name of shellNames) {
      const title = t(handsetById[name].labelKey);
      document.querySelector(`[data-shell-name="${name}"]`).textContent = title;
      document.querySelector(`[data-shell-choice="${name}"]`).setAttribute('aria-label',title);
    }
    $('[data-language-label]').textContent = t('languageLabel');
    $('[data-language-value]').textContent = {zh:'中文',en:'English',ja:'日本語'}[language];
    $('[data-language]').setAttribute('aria-label',t('language'));
  } else {
    $('#posts').setAttribute('aria-label',t('feedLabel'));
    $('#posts').innerHTML = allPosts.map(postMarkup).join('');
    pixelateAvatars($('#posts'));
  }
  if (activeId) document.getElementById(activeId)?.focus({preventScroll:true});
}
// Key legends are printed into the same sampled raster as the housing.
$('.pixel-stickers').innerHTML = [
  ['star-left','sparkle'],['heart-large','heart'],['star-right','sparkle'],['cross','plus'],
  ['star-small','sparkle'],['heart-small','heart'],['star-group','sparkles'],['star-center','sparkle'],['radio','radio']
].map(([name,kind])=>decoration(name,kind)).join('');
if(!isSettings){
  $('.stream-flourish').innerHTML = decoration('footer-star-left','sparkle')+decoration('footer-heart','heart')+decoration('footer-star-right','sparkle');
}
$('#streamButton').addEventListener('click',event=>{
  if(isSettings)return;
  event.preventDefault();$('#timeline').scrollTop=0;$('#timeline').focus({preventScroll:true});
});
document.addEventListener('click',event=>{
  const button = event.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-shell-choice')) {
    shell = button.dataset.shellChoice;
    try { storage?.setItem(shellStorageKey,shell); } catch {}
    applyShell(); return;
  }
  if (button.hasAttribute('data-language')) {
    language = ['zh','en','ja'][(['zh','en','ja'].indexOf(language)+1)%3];
    try { storage?.setItem('umwelt-desktop-language',language); } catch {}
    render(); return;
  }
  const post = allPosts.find(item=>item.id===button.dataset.like);
  if (!post) return;
  toggle(state,'likes',post.id);
  button.setAttribute('aria-pressed',String(state.likes.includes(post.id)));
  button.setAttribute('aria-label',likeLabel(post));
  button.innerHTML = likeContent(post);
  if (state.likes.includes(post.id)) celebrateLike(button);
  else clearLikeFeedback(button);
  if (!storage || !writeState(storage,state)) {
    clearTimeout(toastTimer);$('#toast').textContent=t('storage');
    toastTimer=setTimeout(()=>{$('#toast').textContent='';},3500);
  }
});
window.addEventListener('pageshow',()=>{const saved = readSavedShell();if(saved)shell=saved;applyShell();const next=desktopLanguage();if(language!==next){language=next;render();}});
window.addEventListener('storage',event=>{if(event.key===shellStorageKey){shell=normalizeShell(event.newValue)??'leopard';applyShell();}if(event.key==='umwelt-desktop-language'){language=desktopLanguage();render();}});
render();
if(!isSettings)setInterval(()=>{
 for(const post of allPosts){const time=document.querySelector(`[data-post-id="${post.id}"] .post-time`);if(time)time.textContent=timeLabel(post);}
},60000);
