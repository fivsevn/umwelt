import {GAMES, gameTitle, gameDocumentTitle, desktopLanguage} from './games.mjs';

const id = document.body.dataset.game;
const languages = ['zh', 'en', 'ja'];
let language = desktopLanguage();
const copy = {
  zh: {status: '制作中', home: '返回桌面', language: '语言：中文 · 切换为 English'},
  en: {status: 'In development', home: 'Back to desktop', language: 'Language: English · Switch to 日本語'},
  ja: {status: '制作中', home: 'デスクトップへ', language: '言語：日本語 · 中文に切り替え'},
};
function render() {
  document.documentElement.lang = {zh: 'zh-CN', en: 'en', ja: 'ja'}[language];
  document.title = gameDocumentTitle(id, language);
  document.querySelector('[data-title]').textContent = gameTitle(id, language);
  document.querySelector('[data-program]').textContent = GAMES[id].program;
  document.querySelector('[data-status]').textContent = copy[language].status;
  document.querySelector('[data-home]').textContent = copy[language].home;
  const button = document.querySelector('[data-language]');
  button.textContent = {zh: '中', en: 'EN', ja: '日'}[language];
  button.setAttribute('aria-label', copy[language].language);
  button.title = copy[language].language;
}
document.querySelector('[data-language]').addEventListener('click', () => {
  language = languages[(languages.indexOf(language) + 1) % languages.length];
  try { localStorage.setItem('umwelt-desktop-language', language); } catch {}
  render();
});
window.addEventListener('pageshow', () => { language = desktopLanguage(); render(); });
render();
