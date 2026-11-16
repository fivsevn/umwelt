import {shells} from './device/catalog.mjs';

// Preserve the public theme helpers while the device catalog owns available shells.
const themes = {
  leopard:{ink:'#f2eddf',labelKey:'shellLeopard'},
  tokay:{ink:'#17201c',labelKey:'shellTokay'},
  'fat-tail':{ink:'#29281f',labelKey:'shellFatTail'},
  stone:{ink:'#eeeade',labelKey:'shellStone'},
  day:{ink:'#17201c',labelKey:'shellDay'},
  electric:{ink:'#182723',labelKey:'shellElectric'},
};
export const handsetThemes = Object.freeze(shells.map(shell=>Object.freeze({...shell,...themes[shell.id]})));
export const handsetNames = Object.freeze(handsetThemes.map(theme=>theme.id));
export const handsetById = Object.freeze(Object.fromEntries(handsetThemes.map(theme=>[theme.id,theme])));
