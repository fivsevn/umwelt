// One catalog drives saved choices, URLs, the picker and artwork paths.
export const handsetThemes = Object.freeze([
  {id:'leopard',color:'#d7b474',ink:'#f2eddf',labelKey:'shellLeopard'},
  {id:'tokay',color:'#91afbf',ink:'#17201c',labelKey:'shellTokay'},
  {id:'day',color:'#5a9878',ink:'#17201c',labelKey:'shellDay'},
  {id:'crested',color:'#a28b6c',ink:'#eee1cc',labelKey:'shellCrested'},
  {id:'fat-tail',color:'#ae855d',ink:'#29281f',labelKey:'shellFatTail'},
  {id:'mossy',color:'#969d82',ink:'#222c24',labelKey:'shellMossy'},
  {id:'electric',color:'#397da2',ink:'#182723',labelKey:'shellElectric'},
  {id:'stone',color:'#aaa89f',ink:'#eeeade',labelKey:'shellStone'},
]);
export const handsetNames = Object.freeze(handsetThemes.map(theme=>theme.id));
export const handsetById = Object.freeze(Object.fromEntries(handsetThemes.map(theme=>[theme.id,theme])));
