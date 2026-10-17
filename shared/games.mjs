// Canonical program filenames and readable titles; see docs/naming.md.
export const GAMES = Object.freeze({
  tick: Object.freeze({
    program: 'TICK.SYS',
    titles: Object.freeze({zh: '三个信号', en: 'Three Signals', ja: '三つの信号'}),
  }),
  isopoda: Object.freeze({
    program: 'ISOPODA.EXE',
    titles: Object.freeze({zh: '等足目赋格', en: 'Isopoda Fugue', ja: '等脚目のフーガ'}),
  }),
  rooftop: Object.freeze({
    program: 'ROOFTOP.EXE',
    titles: Object.freeze({zh: '花农时代', en: 'Horticultural Era', ja: '園芸時代'}),
  }),
  ophidia: Object.freeze({
    program: 'OPHIDIA.EXE',
    titles: Object.freeze({zh: '体温调节', en: 'Thermoregulation', ja: '体温調節'}),
  }),
});

export function gameTitle(id, language = 'zh') {
  return GAMES[id].titles[language] || GAMES[id].titles.zh;
}

export function gameDocumentTitle(id, language = 'zh') {
  const english = gameTitle(id, 'en');
  return language === 'en' ? english : `${english} / ${gameTitle(id, language)}`;
}

export function desktopLanguage() {
  try {
    const language = globalThis.localStorage.getItem('umwelt-desktop-language');
    if (['zh', 'en', 'ja'].includes(language)) return language;
  } catch { /* A readable title is available even when storage is disabled. */ }
  return 'zh';
}
