import {gameDocumentTitle, desktopLanguage} from '../shared/games.mjs';
import {profiles, posts as seeds} from './data/feed.mjs';
import {copy} from './locales.mjs';
import {likeIcon, commentIcon} from './icons.mjs';
import {createThreads} from './threads.mjs';
import {postTime} from './time.mjs';
import {STORAGE_KEY, createStateStore, toggle} from './state.mjs';
import {decoration} from './decorations.mjs';
import {handsetById} from './handsets.mjs';
import {shells, antennas, charms} from './device/catalog.mjs';
import {mountDevice} from './device/stage.mjs';
import {APPEARANCE_STORAGE_KEY, APPEARANCE_KEYS, DEFAULT_APPEARANCE, normalizeAppearance, readAppearance, writeAppearance, appearanceFromURL, setAppearanceURL} from './device/selection.mjs';
import {pixelateAvatars} from './avatars.mjs';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isSettings = document.body.dataset.view === 'settings';
let selectedUser = null;
const userFromURL = () => isSettings ? null : new URLSearchParams(location.search).get('user');
let selectedPost = null;
const postFromURL = () => isSettings ? null : new URLSearchParams(location.search).get('post');
let language = desktopLanguage(), storage, toastTimer;
try { storage = window.localStorage; } catch {}
const isAppearancePreview = new URLSearchParams(location.search).get('appearance-preview') === '1';
function savedAppearance() {
  try { return storage?.getItem(APPEARANCE_STORAGE_KEY) ? readAppearance(storage) : null; }
  catch { return null; }
}
// A history entry can carry an older URL than the choice made in settings.
const returningThroughHistory = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
let appearance = (!isAppearancePreview && returningThroughHistory ? savedAppearance() : null)
  ?? appearanceFromURL(location.search,isAppearancePreview ? DEFAULT_APPEARANCE : readAppearance(storage));
const device = mountDevice();
const appearanceGroups = [
  {key:'shell',labelKey:'shellLabel',items:shells},
  {key:'antenna',labelKey:'antennaLabel',items:antennas},
  {key:'charm',labelKey:'charmLabel',items:charms},
];
const appearanceURL = url => setAppearanceURL(url,appearance,isAppearancePreview);
function reportAppearance() {
  if (isAppearancePreview && window.parent !== window) window.parent.postMessage({type:'gsm-appearance-state',appearance:{...appearance}},location.origin);
}
function markAppearanceChoices() {
  for (const key of APPEARANCE_KEYS) {
    for (const button of document.querySelectorAll(`[data-${key}-choice]`)) button.setAttribute('aria-pressed',String(button.getAttribute(`data-${key}-choice`) === appearance[key]));
  }
}
function applyAppearance() {
  for (const key of APPEARANCE_KEYS) document.documentElement.dataset[key] = appearance[key];
  document.documentElement.style.setProperty('--key-ink',handsetById[appearance.shell].ink);
  device.update({...appearance});
  // Keep the addressed post, author and history state when updating the device.
  const url = appearanceURL(new URL(location.href));
  // Appearance and controls must still update if the browser refuses a history write.
  if (url.href !== location.href) { try { history.replaceState(history.state,'',url); } catch {} }
  document.querySelector('meta[name="theme-color"]').content = handsetById[appearance.shell].color;
  markAppearanceChoices();
  for (const link of document.querySelectorAll('a[data-profile]')) link.href = streamURL(link.dataset.profile);
  for (const link of document.querySelectorAll('a[data-thread],a[data-parent]')) link.href = threadURL(link.dataset.thread ?? link.dataset.parent);
  updateBackLink();
  // Explicit URLs also carry all three choices when storage is unavailable.
  for (const [id,path] of [['streamButton',isSettings?'../':'./'],['settingsButton',isSettings?'./':'./settings/']]) {
    const link = appearanceURL(new URL(path,location.href));
    document.getElementById(id).href = link.pathname+link.search;
  }
  reportAppearance();
}
if (isSettings) {
  $('#appearanceControls').innerHTML = appearanceGroups.map(({key,labelKey,items})=>`<fieldset class="appearance-picker" data-appearance-group="${key}"><legend data-appearance-label="${key}">${escape(copy[language][labelKey])}</legend><div class="appearance-options">${items.map(item=>{
    const title = item.labels?.[language] ?? item.labels?.zh ?? item.name;
    return `<button type="button" class="appearance-option" id="appearance-${key}-${item.id}" data-${key}-choice="${item.id}" aria-pressed="false" aria-label="${escape(title)}">${escape(title)}</button>`;
  }).join('')}</div></fieldset>`).join('');
}
applyAppearance();
// Keep earlier local records intact; published packages are the timeline source.
const stateStore = createStateStore(storage, Object.keys(profiles));
const state = stateStore.state;
const allPosts = seeds;
const threads = createThreads(allPosts);
function streamURL(user = null) {
  const url = appearanceURL(new URL('./',import.meta.url));
  if (user !== null) url.searchParams.set('user',user);
  return url.pathname+url.search;
}
function threadURL(id) {
  const url = new URL(streamURL(),location.origin);
  url.searchParams.set('post',id);
  return url.pathname+url.search;
}
function updateBackLink() {
  $('#homeButton').href = isSettings ? streamURL() : userFromURL() !== null || postFromURL() !== null ? returnURL() : new URL('../',import.meta.url).pathname;
}
function returnURL() {
  const url = new URL(history.state?.gsmReturnURL ?? streamURL(),location.origin);
  if (url.origin !== location.origin || url.pathname !== new URL('./',import.meta.url).pathname) return streamURL();
  appearanceURL(url);
  return url.pathname+url.search;
}
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
function commentsMarkup(root) {
  const comments = threads.commentsFor(root.id);
  return `<section class="comments" id="comments-body-${root.id}" tabindex="-1" role="region" aria-label="${escape(t('commentsLabel'))}"><h3 class="comments-title">${escape(t('commentsCount',{count:comments.length}))}</h3>${comments.length?comments.map(post=>postMarkup(post,true)).join(''):`<p class="profile-empty">${escape(t('noComments'))}</p>`}</section>`;
}
function postMarkup(post, comment = false) {
  const profile = profiles[post.author];
  const blocks = localized(post.blocks);
  const parent = threads.parentFor(post.id);
  const root = threads.rootFor(post.id);
  const commentControl = comment ? '' : selectedPost !== null
    ? `<a class="comments-link" id="comments-${post.id}" data-comments-jump="${root.id}" href="#comments-body-${root.id}" aria-label="${escape(t('viewComments',{count:threads.countFor(root.id)}))}">${commentIcon()}<span class="comment-count">${threads.countFor(root.id)}</span></a>`
    : `<a class="comments-link" id="comments-${post.id}" data-thread="${post.id}" href="${escape(threadURL(post.id))}" aria-label="${escape(t('viewComments',{count:threads.countFor(root.id)}))}">${commentIcon()}<span class="comment-count">${threads.countFor(root.id)}</span></a>`;
  return `<article class="${comment?'comment':'post'}" id="post-${post.id}" tabindex="-1" data-post-id="${post.id}" data-tone="${profile.color}">
    <div class="post-content bubble">
      <header class="post-identity"><a class="avatar" id="profile-${post.id}" data-profile="${escape(post.author)}" href="${escape(streamURL(post.author))}" aria-label="${escape(t('viewProfile',{name:localized(profile.name)}))}"><img data-pixel-avatar src="${new URL(profile.avatarImage,import.meta.url).href}" width="16" height="16" alt="" decoding="async"></a><span class="author-name"><a class="author-label" id="profile-name-${post.id}" data-profile="${escape(post.author)}" href="${escape(streamURL(post.author))}" aria-label="${escape(t('viewProfile',{name:localized(profile.name)}))}">${escape(localized(profile.name))}</a><a class="author-handle" id="profile-handle-${post.id}" data-profile="${escape(post.author)}" href="${escape(streamURL(post.author))}" aria-label="${escape(t('viewProfile',{name:'@'+profile.handle}))}">@${escape(profile.handle)}</a></span></header>
      ${parent?`<p class="reply-context"><a id="parent-${post.id}" data-parent="${parent.id}" href="${escape(threadURL(parent.id))}">${escape(t('replyingTo',{name:'@'+profiles[parent.author].handle}))}</a>${!comment?` · <a id="thread-${post.id}" data-thread="${post.id}" href="${escape(threadURL(post.id))}">${escape(t('viewThread'))}</a>`:''}</p>`:''}
      ${blocks.map(block=>block.type==='image'?`<figure class="post-media${block.kind==='emote'?' post-emote':''}"><img src="${new URL(block.src,import.meta.url).href}" width="${block.width}" height="${block.height}" alt="${escape(block.alt)}" loading="lazy"></figure>`:`<p class="post-text">${escape(block.text)}</p>`).join('')}
      <footer class="post-footer">
        <time class="post-time" datetime="${post.date}" title="${escape(new Date(post.createdAt).toLocaleString({zh:'zh-CN',en:'en-GB',ja:'ja-JP'}[language],{timeZone:'Asia/Shanghai'}))}">${timeLabel(post)}</time>
        <div class="post-actions">${commentControl}<button type="button" id="like-${post.id}" data-like="${post.id}" aria-pressed="${state.likes.includes(post.id)}" aria-label="${escape(likeLabel(post))}">${likeContent(post)}</button></div>
      </footer>
    </div>
    ${!comment && selectedPost !== null?commentsMarkup(post):''}
  </article>`;
}
function profileMarkup(profile, count) {
  if (!profile) return `<h2 id="profileTitle" tabindex="-1">${escape(t('profileMissing'))}</h2><p class="profile-empty">${escape(t('profileUnavailable'))}</p>`;
  return `<div class="profile-identity"><span class="avatar profile-avatar" aria-hidden="true"><img data-pixel-avatar src="${new URL(profile.avatarImage,import.meta.url).href}" width="16" height="16" alt="" decoding="async"></span><div class="profile-details"><h2 id="profileTitle" tabindex="-1">${escape(localized(profile.name))}</h2><p class="profile-handle">@${escape(profile.handle)}</p><p class="profile-count">${escape(t('postCount',{count}))}</p></div></div>${profile.bio?`<p class="profile-bio">${escape(localized(profile.bio))}</p>`:''}`;
}
function threadMarkup(root) {
  return root?'':`<h2 id="threadTitle" tabindex="-1">${escape(t('threadMissing'))}</h2><p class="profile-empty">${escape(t('threadUnavailable'))}</p>`;
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
function refreshStoredState() {
  if (isAppearancePreview || !stateStore.refresh()) return;
  for (const button of document.querySelectorAll('button[data-like]')) {
    const post = threads.byId.get(button.dataset.like);
    if (!post) continue;
    clearLikeFeedback(button);
    button.setAttribute('aria-pressed',String(state.likes.includes(post.id)));
    button.setAttribute('aria-label',likeLabel(post));
    button.innerHTML = likeContent(post);
  }
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
  button.append(burst);
  button.classList.add('is-celebrating');
  const timer = setTimeout(()=>clearLikeFeedback(button),650);
  likeFeedback.set(button,{burst,timer});
}

function render() {
  const activeId = document.activeElement?.id;
  selectedPost = postFromURL();
  selectedUser = selectedPost === null ? userFromURL() : null;
  const profile = selectedUser !== null && Object.hasOwn(profiles,selectedUser) ? profiles[selectedUser] : null;
  const root = selectedPost === null ? null : threads.rootFor(selectedPost);
  document.documentElement.lang = {zh:'zh-CN',en:'en',ja:'ja'}[language];
  document.title = (isSettings?t('settings')+' · ':selectedPost !== null?t(root?'threadTitle':'threadMissing')+' · ':selectedUser !== null?(profile?localized(profile.name):t('profileMissing'))+' · ':'')+gameDocumentTitle('gsm',language);
  const backLabel=t(isSettings || selectedUser !== null || selectedPost !== null ? 'backToFeed' : 'homeLink');
  $('#homeButton').setAttribute('aria-label',backLabel);
  $('#homeButton').title=backLabel;
  updateBackLink();
  $('[data-skip]').textContent = isSettings?t('settings'):selectedPost !== null?t('skipThread'):selectedUser !== null?t('skipProfile'):t('skip');
  $('#settingsButton').setAttribute('aria-label',t('settings'));
  $('#settingsButton').title = t('settings');
  $('#mainNav').setAttribute('aria-label',t('navigation'));
  if (isSettings) {
    $('#settingsTitle').textContent = t('settings');
    for (const {key,labelKey,items} of appearanceGroups) {
      document.querySelector(`[data-appearance-label="${key}"]`).textContent = t(labelKey);
      for (const item of items) {
        const title = item.labels?.[language] ?? item.labels?.zh ?? item.name;
        const button = document.querySelector(`[data-${key}-choice="${item.id}"]`);
        button.textContent = title;
        button.setAttribute('aria-label',title);
      }
    }
    $('[data-language-label]').textContent = t('languageLabel');
    $('[data-language-value]').textContent = {zh:'中文',en:'English',ja:'日本語'}[language];
    $('[data-language]').setAttribute('aria-label',t('language'));
  } else {
    const visiblePosts = selectedPost !== null ? root?[root]:[] : selectedUser === null ? threads.roots : profile ? allPosts.filter(post=>post.author===selectedUser) : [];
    $('#profile').hidden = selectedUser === null;
    $('#profile').innerHTML = selectedUser === null ? '' : profileMarkup(profile,visiblePosts.length);
    $('#thread').hidden = selectedPost === null || !!root;
    $('#thread').innerHTML = selectedPost === null ? '' : threadMarkup(root);
    $('#posts').setAttribute('aria-label',selectedPost !== null?t('threadTitle'):selectedUser === null?t('feedLabel'):t('profilePosts',{name:profile?localized(profile.name):selectedUser}));
    $('#posts').innerHTML = visiblePosts.map(post=>postMarkup(post)).join('');
    if (profile && !visiblePosts.length) $('#posts').innerHTML = `<p class="profile-empty">${escape(t('noPosts'))}</p>`;
    if (selectedUser === null && selectedPost === null) $('#streamButton').setAttribute('aria-current','page');
    else $('#streamButton').removeAttribute('aria-current');
    pixelateAvatars($('#timeline'));
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
let viewSaveTimer,backPending=false;
function rememberView() {
  clearTimeout(viewSaveTimer);viewSaveTimer=null;
  if (isSettings) return;
  const gsmView={scrollTop:$('#timeline').scrollTop,focusId:document.activeElement?.id};
  if (history.state?.gsmView?.scrollTop===gsmView.scrollTop && history.state?.gsmView?.focusId===gsmView.focusId) return;
  // Safari limits history writes. Saving a reading position must never block a link.
  try { history.replaceState({...history.state,gsmView},''); } catch {}
}
function scheduleViewSave() {
  // Inertial scrolling can emit dozens of events each second; save at most once a second.
  if (!viewSaveTimer) viewSaveTimer=setTimeout(rememberView,1000);
}
function restoreView(saved = history.state?.gsmView) {
  $('#timeline').scrollTop = saved?.scrollTop ?? 0;
  const target = saved?.focusId && document.getElementById(saved.focusId);
  (target || $('#profileTitle') || $('#threadTitle') || $('#timeline')).focus({preventScroll:true});
}
function focusPost(id) {
  const target = document.getElementById(`post-${id}`);
  if (!target) return false;
  if (selectedPost !== null && threads.rootFor(id)?.id === id) $('#timeline').scrollTop = 0;
  else target.scrollIntoView({block:'start'});
  target.focus({preventScroll:true});
  return true;
}
function navigateURL(url, target = null) {
  rememberView();
  try { history.pushState({gsmFromApp:true,gsmReturnURL:location.pathname+location.search},'',url); }
  catch { location.assign(url);return; }
  render();
  $('#timeline').scrollTop = 0;
  if (!target || !focusPost(target)) ($('#profileTitle') || $('#threadTitle') || $('#timeline')).focus({preventScroll:true});
}
function backToSource() {
  if (backPending) return;
  if ((history.state?.gsmFromApp || history.state?.gsmProfileFromFeed) && history.length>1) {
    rememberView();backPending=true;
    try { history.back(); } catch { backPending=false;location.assign(returnURL()); }
  }
  else navigateURL(streamURL());
}
const plainClick = event => !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
$('#homeButton').addEventListener('click',event=>{
  if(isSettings || !plainClick(event) || selectedUser === null && selectedPost === null)return;
  event.preventDefault();
  backToSource();
});
$('#streamButton').addEventListener('click',event=>{
  if(isSettings || !plainClick(event))return;
  event.preventDefault();
  if (selectedUser !== null || selectedPost !== null) {
    if ((history.state?.gsmFromApp || history.state?.gsmProfileFromFeed) && returnURL() === streamURL()) backToSource();
    else navigateURL(streamURL());
  }
  else { $('#timeline').scrollTop=0;$('#timeline').focus({preventScroll:true}); }
});
if (!isSettings) {
  document.addEventListener('click',event=>{
    const link = event.target.closest('a[data-profile],a[data-thread],a[data-parent],a[data-comments-jump]');
    if (!link || !plainClick(event)) return;
    event.preventDefault();
    if (link.hasAttribute('data-comments-jump')) {
      const section = document.getElementById(`comments-body-${link.dataset.commentsJump}`);
      section?.scrollIntoView({block:'start'});
      section?.focus({preventScroll:true});
    } else if (link.hasAttribute('data-parent')) {
      if (!focusPost(link.dataset.parent)) { link.focus({preventScroll:true}); navigateURL(threadURL(link.dataset.parent),link.dataset.parent); }
    } else if (link.hasAttribute('data-thread')) {
      link.focus({preventScroll:true});
      navigateURL(threadURL(link.dataset.thread),link.dataset.thread);
    } else if (link.dataset.profile === selectedUser) { $('#timeline').scrollTop=0;$('#profileTitle').focus({preventScroll:true}); }
    else { link.focus({preventScroll:true}); navigateURL(streamURL(link.dataset.profile)); }
  });
  $('#timeline').addEventListener('scroll',scheduleViewSave,{passive:true});
  window.addEventListener('pagehide',rememberView);
  window.addEventListener('popstate',()=>{backPending=false;clearTimeout(viewSaveTimer);viewSaveTimer=null;applyAppearance();render();restoreView();});
}

document.addEventListener('click',event=>{
  const button = event.target.closest('button');
  if (!button) return;
  const appearanceKey = APPEARANCE_KEYS.find(key=>button.hasAttribute(`data-${key}-choice`));
  if (appearanceKey) {
    appearance = normalizeAppearance({[appearanceKey]:button.getAttribute(`data-${appearanceKey}-choice`)},appearance);
    if (!isAppearancePreview) writeAppearance(storage,appearance);
    applyAppearance(); return;
  }
  if (button.hasAttribute('data-language')) {
    language = ['zh','en','ja'][(['zh','en','ja'].indexOf(language)+1)%3];
    if (!isAppearancePreview) { try { storage?.setItem('umwelt-desktop-language',language); } catch {} }
    render(); return;
  }
  const post = allPosts.find(item=>item.id===button.dataset.like);
  if (!post) return;
  refreshStoredState();
  toggle(state,'likes',post.id);
  button.setAttribute('aria-pressed',String(state.likes.includes(post.id)));
  button.setAttribute('aria-label',likeLabel(post));
  button.innerHTML = likeContent(post);
  if (state.likes.includes(post.id)) celebrateLike(button);
  else clearLikeFeedback(button);
  if (!isAppearancePreview && !stateStore.save()) {
    clearTimeout(toastTimer);$('#toast').textContent=t('storage');
    toastTimer=setTimeout(()=>{$('#toast').textContent='';},3500);
  }
});
window.addEventListener('pageshow',event=>{
  backPending=false;
  if (event.persisted && !isAppearancePreview) {
    // A restored page follows any manual preference saved while it was away.
    appearance=savedAppearance() ?? appearance;
  }
  applyAppearance();
  if (!isAppearancePreview) { const next=desktopLanguage();if(language!==next){language=next;render();} }
  refreshStoredState();
});
window.addEventListener('storage',event=>{
  if (isAppearancePreview) return;
  if (event.key===STORAGE_KEY || event.key===null) refreshStoredState();
  if (event.key===APPEARANCE_STORAGE_KEY || event.key===null) { appearance=readAppearance(storage);applyAppearance(); }
  if (event.key==='umwelt-desktop-language' || event.key===null) { language=desktopLanguage();render(); }
});
window.addEventListener('message',event=>{
  if (!isAppearancePreview || event.source!==window.parent || event.origin!==location.origin || event.data?.type!=='gsm-appearance-preview') return;
  appearance=normalizeAppearance(event.data.appearance,appearance);
  applyAppearance();
});
render();
if (!isSettings) {
  const initialView=history.state?.gsmView,initialPost=selectedPost,initialUser=selectedUser;
  if (initialView || initialPost !== null) device.ready.then(()=>{
    // Hidden screen content cannot receive focus until the first device is visible.
    if (selectedPost !== initialPost || selectedUser !== initialUser) return;
    if (initialView) restoreView(initialView);
    else if (!focusPost(initialPost)) $('#threadTitle')?.focus({preventScroll:true});
  });
}
if(!isSettings)setInterval(()=>{
 for(const post of allPosts){const time=document.querySelector(`[data-post-id="${post.id}"] .post-time`);if(time)time.textContent=timeLabel(post);}
},60000);
