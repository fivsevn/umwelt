import {gameDocumentTitle, desktopLanguage} from '../shared/games.mjs';
import {profiles, posts as seeds} from './data/feed.mjs';
import {copy} from './locales.mjs';
import {likeIcon, commentIcon} from './icons.mjs';
import {createThreads} from './threads.mjs';
import {postTime} from './time.mjs';
import {freshState, readState, writeState, toggle} from './state.mjs';
import {decoration} from './decorations.mjs';
import {handsetThemes, handsetNames as shellNames, handsetById} from './handsets.mjs';
import {pixelateAvatars} from './avatars.mjs';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isSettings = document.body.dataset.view === 'settings';
let selectedUser = null;
const userFromURL = () => isSettings ? null : new URLSearchParams(location.search).get('user');
let selectedPost = null;
const postFromURL = () => isSettings ? null : new URLSearchParams(location.search).get('post');
let language = desktopLanguage(), storage, toastTimer;
const shellAliases = new Map([['mint','leopard'],['blue','tokay'],['berry','day'],['blizzard','stone']]);
const normalizeShell = value => shellNames.includes(value) ? value : shellAliases.get(value);
const shellStorageKey = 'umwelt-gsm-shell';
let shell, sessionStore;
try { storage = window.localStorage; } catch {}
try { sessionStore = window.sessionStorage; } catch {}
function readSessionShell() {
  try { return normalizeShell(sessionStore?.getItem(shellStorageKey)); } catch {}
}
const requestedShell = normalizeShell(new URLSearchParams(location.search).get('shell'));
const navigationType = performance.getEntriesByType('navigation')[0]?.type;
const randomShell = () => shellNames[Math.floor(Math.random()*shellNames.length)];
shell = navigationType === 'reload' ? randomShell()
  : (navigationType === 'back_forward' ? readSessionShell() : null) ?? requestedShell ?? randomShell();
function applyShell() {
  try { sessionStore?.setItem(shellStorageKey,shell); } catch {}
  document.documentElement.dataset.shell = shell;
  document.documentElement.style.setProperty('--key-ink',handsetById[shell].ink);
  document.querySelector('[data-shell-art-wide]').srcset = new URL(`./assets/pocket-${shell}-wide.webp`,import.meta.url).href;
  document.querySelector('[data-shell-art]').src = new URL(`./assets/pocket-${shell}.webp`,import.meta.url).href;
  // Keep history entries consistent with the cover restored on back/forward.
  const url = new URL(location.href);
  url.searchParams.set('shell',shell);
  if (url.href !== location.href) history.replaceState(history.state,'',url);
  document.querySelector('meta[name="theme-color"]').content = handsetById[shell].color;
  document.querySelectorAll('[data-shell-choice]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.shellChoice === shell)));
  for (const link of document.querySelectorAll('a[data-profile]')) link.href = streamURL(link.dataset.profile);
  for (const link of document.querySelectorAll('a[data-thread],a[data-parent]')) link.href = threadURL(link.dataset.thread ?? link.dataset.parent);
  for (const back of document.querySelectorAll('[data-profile-back],[data-thread-back]')) back.href = returnURL();
  // Preserve a preview choice and storage-denied sessions through both pages.
  for (const [id,path] of [['streamButton',isSettings?'../':'./'],['settingsButton',isSettings?'./':'./settings/']]) {
    document.getElementById(id).href = `${path}?shell=${shell}`;
  }
}
if (isSettings) {
  $('.shell-options').innerHTML = handsetThemes.map(({id,labelKey})=>{
    const title=copy[language][labelKey] ?? copy.zh[labelKey];
    return `<button type="button" class="shell-option" data-shell-choice="${id}" aria-pressed="false" aria-label="${escape(title)}"><span class="mini-phone" aria-hidden="true"><span class="mini-pattern" data-mini-shell="${id}"></span></span><span data-shell-name="${id}">${escape(title)}</span></button>`;
  }).join('');
}
applyShell();
document.querySelectorAll('[data-mini-shell]').forEach(element => { element.innerHTML = `<img src="${new URL(`./assets/pocket-${element.dataset.miniShell}-thumb.webp`,import.meta.url).href}" alt="" loading="lazy" decoding="async">`; });
// Keep earlier local records intact; published packages are the timeline source.
const state = storage ? readState(storage, Object.keys(profiles)) : freshState();
const allPosts = seeds;
const threads = createThreads(allPosts);
function streamURL(user = null) {
  const url = new URL('./',import.meta.url);
  if (user !== null) url.searchParams.set('user',user);
  url.searchParams.set('shell',shell);
  return url.pathname+url.search;
}
function threadURL(id) {
  const url = new URL(streamURL(),location.origin);
  url.searchParams.set('post',id);
  return url.pathname+url.search;
}
function returnURL() {
  const url = new URL(history.state?.gsmReturnURL ?? streamURL(),location.origin);
  if (url.origin !== location.origin || url.pathname !== new URL('./',import.meta.url).pathname) return streamURL();
  url.searchParams.set('shell',shell);
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
      ${blocks.map(block=>block.type==='image'?`<figure class="post-media"><img src="${new URL(block.src,import.meta.url).href}" width="${block.width}" height="${block.height}" alt="${escape(block.alt)}" loading="lazy"></figure>`:`<p class="post-text">${escape(block.text)}</p>`).join('')}
      <footer class="post-footer">
        <time class="post-time" datetime="${post.date}" title="${escape(new Date(post.createdAt).toLocaleString({zh:'zh-CN',en:'en-GB',ja:'ja-JP'}[language],{timeZone:'Asia/Shanghai'}))}">${timeLabel(post)}</time>
        <div class="post-actions">${commentControl}<button type="button" id="like-${post.id}" data-like="${post.id}" aria-pressed="${state.likes.includes(post.id)}" aria-label="${escape(likeLabel(post))}">${likeContent(post)}</button></div>
      </footer>
    </div>
    ${!comment && selectedPost !== null?commentsMarkup(post):''}
  </article>`;
}
function profileMarkup(profile, count) {
  const back = `<a id="profileBack" class="profile-back" data-profile-back href="${escape(returnURL())}" aria-label="${escape(t('backToFeed'))}"><span aria-hidden="true">←</span></a>`;
  if (!profile) return `${back}<h2 id="profileTitle" tabindex="-1">${escape(t('profileMissing'))}</h2><p class="profile-empty">${escape(t('profileUnavailable'))}</p>`;
  return `${back}<div class="profile-identity"><span class="avatar profile-avatar" aria-hidden="true"><img data-pixel-avatar src="${new URL(profile.avatarImage,import.meta.url).href}" width="16" height="16" alt="" decoding="async"></span><div class="profile-details"><h2 id="profileTitle" tabindex="-1">${escape(localized(profile.name))}</h2><p class="profile-handle">@${escape(profile.handle)}</p><p class="profile-count">${escape(t('postCount',{count}))}</p></div></div>${profile.bio?`<p class="profile-bio">${escape(localized(profile.bio))}</p>`:''}`;
}
function threadMarkup(root) {
  return `<a id="threadBack" class="profile-back" data-thread-back href="${escape(returnURL())}" aria-label="${escape(t('backToFeed'))}"><span aria-hidden="true">←</span></a>${root?'':`<h2 id="threadTitle" tabindex="-1">${escape(t('threadMissing'))}</h2><p class="profile-empty">${escape(t('threadUnavailable'))}</p>`}`;
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
  $('[data-home]').setAttribute('aria-label',t('homeLink'));
  $('[data-home]').title = t('homeLink');
  $('[data-skip]').textContent = isSettings?t('settings'):selectedPost !== null?t('skipThread'):selectedUser !== null?t('skipProfile'):t('skip');
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
    const visiblePosts = selectedPost !== null ? root?[root]:[] : selectedUser === null ? threads.roots : profile ? allPosts.filter(post=>post.author===selectedUser) : [];
    $('#profile').hidden = selectedUser === null;
    $('#profile').innerHTML = selectedUser === null ? '' : profileMarkup(profile,visiblePosts.length);
    $('#thread').hidden = selectedPost === null;
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
function rememberView() {
  if (isSettings) return;
  history.replaceState({...history.state,gsmView:{scrollTop:$('#timeline').scrollTop,focusId:document.activeElement?.id}},'');
}
function restoreView() {
  const saved = history.state?.gsmView;
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
  history.pushState({gsmFromApp:true,gsmReturnURL:location.pathname+location.search},'',url);
  render();
  $('#timeline').scrollTop = 0;
  if (!target || !focusPost(target)) ($('#profileTitle') || $('#threadTitle') || $('#timeline')).focus({preventScroll:true});
}
function backToSource() {
  if (history.state?.gsmFromApp || history.state?.gsmProfileFromFeed) { rememberView(); history.back(); }
  else navigateURL(streamURL());
}
const plainClick = event => !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
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
    const link = event.target.closest('a[data-profile],a[data-profile-back],a[data-thread],a[data-parent],a[data-thread-back],a[data-comments-jump]');
    if (!link || !plainClick(event)) return;
    event.preventDefault();
    if (link.hasAttribute('data-comments-jump')) {
      const section = document.getElementById(`comments-body-${link.dataset.commentsJump}`);
      section?.scrollIntoView({block:'start'});
      section?.focus({preventScroll:true});
    } else if (link.hasAttribute('data-profile-back') || link.hasAttribute('data-thread-back')) backToSource();
    else if (link.hasAttribute('data-parent')) {
      if (!focusPost(link.dataset.parent)) { link.focus({preventScroll:true}); navigateURL(threadURL(link.dataset.parent),link.dataset.parent); }
    } else if (link.hasAttribute('data-thread')) {
      link.focus({preventScroll:true});
      navigateURL(threadURL(link.dataset.thread),link.dataset.thread);
    } else if (link.dataset.profile === selectedUser) { $('#timeline').scrollTop=0;$('#profileTitle').focus({preventScroll:true}); }
    else { link.focus({preventScroll:true}); navigateURL(streamURL(link.dataset.profile)); }
  });
  $('#timeline').addEventListener('scroll',rememberView,{passive:true});
  window.addEventListener('popstate',()=>{applyShell();render();restoreView();});
}

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
window.addEventListener('pageshow',()=>{const saved = readSessionShell();if(saved)shell=saved;applyShell();const next=desktopLanguage();if(language!==next){language=next;render();}});
window.addEventListener('storage',event=>{if(event.key===shellStorageKey){shell=normalizeShell(event.newValue)??'leopard';applyShell();}if(event.key==='umwelt-desktop-language'){language=desktopLanguage();render();}});
render();
if (!isSettings && history.state?.gsmView) restoreView();
else if (!isSettings && selectedPost !== null) { if (!focusPost(selectedPost)) $('#threadTitle')?.focus({preventScroll:true}); }
if(!isSettings)setInterval(()=>{
 for(const post of allPosts){const time=document.querySelector(`[data-post-id="${post.id}"] .post-time`);if(time)time.textContent=timeLabel(post);}
},60000);
