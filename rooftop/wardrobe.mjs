import { LOOKS, LOOK_BY_ID, DEFAULT_LOOK } from './fashion/catalog.mjs';
// The small 2D fallback consumes the same palettes; 3D uses full authored cuts.
export const OUTFITS=Object.fromEntries(LOOKS.map(l=>[l.id,[l.name,...l.palette.slice(0,3),['dress'].includes(l.model?.cut)||['bar','tweed','mondrian','quant','chiton','kosode','tang'].includes(l.id)?'dress':'overall']]));
export const DECORATIONS=Object.fromEntries(LOOKS.map(l=>[l.id,l.name+' · '+l.pig]));
export function normalizeWardrobe(value) {
  if(!value||typeof value!=='object')return null;
  if(Object.hasOwn(LOOK_BY_ID,value.outfit)&&Object.hasOwn(LOOK_BY_ID,value.pig))return {outfit:value.outfit,pig:value.pig};
  // Retired colour variants migrate once into a matching historical pair.
  const legacy=/^(sage|clay|blue|cream|(?:dress|apron|overall|stripe|check|jacket|pocket)-(?:sage|clay|blue|cream|berry))$/;
  const pigLegacy=/^(scarf|ribbon|flower|(?:scarf|ribbon|flower|vest|cap|bonnet|bell)-(?:sage|clay|blue|cream|berry))$/;
  if(legacy.test(value.outfit)&&pigLegacy.test(value.pig))return {outfit:DEFAULT_LOOK,pig:DEFAULT_LOOK};
  return null;
}
export const ACTIVITIES = {
  rest: "歇一会儿",
  walk: "散步",
  water: "浇水",
  prune: "摘枯叶",
  inspect: "观察植物",
  tend: "喂小鱼",
  wipe: "擦器具",
  sweep: "扫落叶",
  wash: "洗手",
  tea: "喝茶",
  sit: "坐着发呆",
  feed: "给小猪添饭",
};
// A fresh reload chooses one pair; navigation keeps the current selection.
const storageKey=typeof location!=='undefined'&&location.pathname.startsWith('/rooftop/art/')?'umwelt-dongdong-wardrobe-preview-v1':'umwelt-dongdong-wardrobe-v1';
let previous=null,session=null;
try{previous=normalizeWardrobe(JSON.parse(localStorage.getItem(storageKey)));}catch{}
try{session=normalizeWardrobe(JSON.parse(sessionStorage.getItem(storageKey)));}catch{}
const reload=performance.getEntriesByType('navigation')[0]?.type==='reload';
const choices=LOOKS.filter(l=>l.id!==previous?.outfit),selected=choices[Math.floor(Math.random()*choices.length)].id;
export let wardrobe=!reload&&session?session:{outfit:selected,pig:selected};
function save(){try{localStorage.setItem(storageKey,JSON.stringify(wardrobe));sessionStorage.setItem(storageKey,JSON.stringify(wardrobe));}catch{}}
save();
export function dress(key,value){
  if(!['outfit','pig'].includes(key)||!Object.hasOwn(LOOK_BY_ID,value))return;
  wardrobe[key]=value;
  if(key==='outfit')wardrobe.pig=value;
  save();
}
export function paintPig(c, p, t) {
  c.save();
  c.translate(Math.round(p.x), Math.round(p.y));
  const px = (x, y, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(x, y, w, h);
    },
    walk = p.state === "walk",
    step = walk ? Math.floor(t * 6) % 2 : 0;
  px(-7, 1, 17, 2, "#64705a44");
  c.scale(p.facing === "west" ? -1 : 1, 1);
  px(-4, -2 + step, 3, 4, "#aa8179");
  px(3, -2 - step, 3, 4, "#aa8179");
  px(-7, -10, 17, 7, "#d3a99b");
  px(-5, -13, 13, 10, "#dfb9a7");
  px(-3, -14, 8, 2, "#ead0b8");
  px(-4, -12, 9, 2, "#edcdb8");
  px(-6, -5, 14, 2, "#c99b8e");
  px(4, -13, 10, 10, "#e3bdab");
  px(6, -15, 3, 4, "#cf9b90");
  px(7, -14, 1, 2, "#e8bdb0");
  px(12, -13, 2, 3, "#d2a194");
  px(9, -10, 2, 2, "#4f4840");
  px(9, -10, 1, 1, "#f5e4cc");
  px(8, -6, 3, 2, "#db9e98");
  px(12, -8, 5, 4, "#edc1b1");
  px(13, -7, 1, 1, "#a97670");
  px(15, -7, 1, 1, "#a97670");
  px(-9, -8, 3, 2, "#c48e83");
  px(-10, -10, 2, 3, "#d9ac9d");
  px(-9, -11, 3, 1, "#d9ac9d");
  px(-8, -10, 1, 1, "#d9ac9d");
  const look=LOOK_BY_ID[wardrobe.pig];
  const d = look && ['scarf',...look.palette];
  if (d) {
    const [kind, a, b, light] = d;
    if (kind === "vest") {
      px(-5, -11, 10, 7, a);
      px(-5, -11, 10, 1, light);
      px(-5, -5, 10, 1, b);
      px(1, -10, 1, 5, light);
    }
    if (kind === "scarf") {
      px(4, -9, 3, 6, a);
      px(3, -3, 3, 3, light);
      px(4, -8, 3, 1, b);
    }
    if (kind === "ribbon") {
      px(4, -16, 3, 3, a);
      px(8, -16, 3, 3, a);
      px(7, -15, 1, 2, light);
    }
    if (kind === "flower") {
      px(5, -16, 5, 2, light);
      px(7, -18, 2, 6, light);
      px(7, -16, 2, 2, a);
    }
    if (kind === "cap") {
      px(4, -17, 9, 2, b);
      px(6, -20, 6, 3, a);
      px(7, -20, 3, 1, light);
    }
    if (kind === "bonnet") {
      px(4, -17, 9, 2, light);
      px(5, -19, 7, 2, a);
      px(4, -15, 2, 3, light);
      px(12, -15, 2, 3, light);
      px(5, -12, 1, 4, a);
    }
    if (kind === "bell") {
      px(4, -10, 3, 6, a);
      px(5, -4, 3, 3, "#c6ad70");
      px(6, -4, 1, 1, "#e2cf96");
      px(6, -1, 1, 1, b);
    }
  }
  c.restore();
}
