import {gameDocumentTitle, desktopLanguage} from '../shared/games.mjs';
import {profiles, posts as seeds} from './data/feed.mjs';
import {copy} from './locales.mjs';
import {likeIcon, navigationIcon} from './icons.mjs';
import {postTime} from './time.mjs';
import {freshState, readState, writeState, toggle} from './state.mjs';
import {decoration} from './decorations.mjs';
import {ditherSVG} from './dither.mjs';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isSettings = document.body.dataset.view === 'settings';
let language = desktopLanguage(), storage, toastTimer;
try { storage = window.localStorage; } catch {}
// Keep earlier local records intact; published packages are the timeline source.
const state = storage ? readState(storage, Object.keys(profiles)) : freshState();
const allPosts = seeds;
const localized = value => typeof value === 'string' ? value : value[language] ?? value.zh;
const t = (key, vars = {}) => Object.entries(vars).reduce((value,[name,replacement]) => value.replace(`{${name}}`, replacement), copy[language][key]);
const texture = (id,width,height,density=.375,mode='fade-down') => `<span class="dither" aria-hidden="true">${ditherSVG({id,width,height,ditherDensity:density,ditherSize:1,ditherMode:mode})}</span>`;

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
    <div class="post-portrait" aria-hidden="true"><span class="avatar"><img src="${new URL(profile.avatarImage,import.meta.url).href}" width="48" height="48" alt=""></span></div>
    <div class="post-content bubble">
      <header class="post-identity"><span class="author-name"><span class="author-label">${escape(localized(profile.name))}</span><span class="author-handle">@${escape(profile.handle)}</span></span></header>
      ${blocks.map(block=>block.type==='image'?`<figure class="post-media"><img src="${new URL(block.src,import.meta.url).href}" width="${block.width}" height="${block.height}" alt="${escape(block.alt)}" loading="lazy"></figure>`:`<p class="post-text">${escape(block.text)}</p>`).join('')}
      <footer class="post-footer">
        <time class="post-time" datetime="${post.date}" title="${escape(new Date(post.createdAt).toLocaleString({zh:'zh-CN',en:'en-GB',ja:'ja-JP'}[language],{timeZone:'Asia/Shanghai'}))}">${timeLabel(post)}</time>
        <div class="post-actions"><button type="button" id="like-${post.id}" data-like="${post.id}" aria-pressed="${state.likes.includes(post.id)}" aria-label="${escape(likeLabel(post))}">${likeContent(post)}</button></div>
      </footer>
      ${texture(post.id,321,10)}
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
    $('[data-language-label]').textContent = t('languageLabel');
    $('[data-language-value]').textContent = {zh:'中文',en:'English',ja:'日本語'}[language];
    $('[data-language]').setAttribute('aria-label',t('language'));
  } else {
    $('#posts').setAttribute('aria-label',t('feedLabel'));
    $('#posts').innerHTML = allPosts.map(postMarkup).join('');
  }
  if (activeId) document.getElementById(activeId)?.focus({preventScroll:true});
}
$('#homeIcon').innerHTML = navigationIcon('home');
$('#streamIcon').innerHTML = navigationIcon('stream');
$('#settingsIcon').innerHTML = navigationIcon('settings');
$('.pixel-stickers').innerHTML = [
  ['star-left','sparkle'],['heart-large','heart'],['star-right','sparkle'],['cross','plus'],
  ['star-small','sparkle'],['heart-small','heart'],['star-group','sparkles'],['star-center','sparkle'],['radio','radio']
].map(([name,kind])=>decoration(name,kind)).join('');
$('.masthead').insertAdjacentHTML('beforeend',texture('header',390,12));
if(isSettings){
  $('.settings-portrait').innerHTML = navigationIcon('settings');
  $('.settings-card').insertAdjacentHTML('beforeend',texture('settings',321,10));
}else{
  $('.stream-flourish').innerHTML = decoration('footer-star-left','sparkle')+decoration('footer-heart','heart')+decoration('footer-star-right','sparkle');
}
$('#streamButton').addEventListener('click',event=>{
  if(isSettings)return;
  event.preventDefault();$('#timeline').scrollTop=0;$('#timeline').focus({preventScroll:true});
});
document.addEventListener('click',event=>{
  const button = event.target.closest('button');
  if (!button) return;
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
window.addEventListener('pageshow',()=>{const next=desktopLanguage();if(language!==next){language=next;render();}});
window.addEventListener('storage',event=>{if(event.key==='umwelt-desktop-language'){language=desktopLanguage();render();}});
render();
if(!isSettings)setInterval(()=>{
 for(const post of allPosts){const time=document.querySelector(`[data-post-id="${post.id}"] .post-time`);if(time)time.textContent=timeLabel(post);}
},60000);
