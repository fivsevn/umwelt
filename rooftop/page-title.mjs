import {desktopLanguage, gameDocumentTitle} from '../shared/games.mjs';

const sections = {
  garage: {zh: '东东的车库', en: 'DongDong’s Garage', ja: '東東のガレージ'},
  room: {zh: '东东的房间', en: 'DongDong’s Room', ja: '東東の部屋'},
};

export function setPageTitle(section) {
  const language = desktopLanguage();
  const title = gameDocumentTitle('rooftop', language);
  document.title = sections[section] ? `${sections[section][language]} · ${title}` : title;
}
