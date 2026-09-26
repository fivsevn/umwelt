import {isopodNumbers} from './locales/isopod.mjs';
import {sceneInstrument} from './scene-readouts.mjs';
import {isEstuaryObservation,estuaryInstrument} from './data/narrative/estuary.mjs';
import {habitatConfig} from './habitats.mjs';
import {gameText} from './locales/game.mjs';
import {getLanguage} from './i18n.mjs';

// Tiny CSS pixel marks: no raster resources, system emoji, or smooth icon font.
const glyphs={
 scopepower:['0111000','1000100','1010100','1000100','0111000','0000010','0000001'],
 scopefocus:['1100011','1000001','0001000','0011100','0001000','1000001','1100011'],
 scopelight:['0001000','0100010','0011100','1011101','0011100','0100010','0001000'],
 microscope:['0011100','0010000','0100110','0100010','0111110','0000010','0111110'],
 pencil:['000000001100','000000011110','000000111100','000001111000','000011110000','000111100000','001111000000','001110000000','001000000000'],
 triangleDown:['1111111','0111110','0011100','0001000'],
 triangleUp:['0001000','0011100','0111110','1111111'],
 minus:['11111'],
 plus:['00100', '00100', '11111', '00100', '00100'],
 center:['0001000', '0111110', '0101010', '1110111', '0101010', '0111110', '0001000'],
 leaf:['000000001100','000000111100','000011111100','000111101100','001111011000','001110111000','001101110000','000011100000','000110000000','001100000000'],
 book:['1101011', '1011101', '1010101', '1010101', '1110111', '0001000'],
 sound:['000010000000','000110001000','111110000100','111110100100','111110100100','111110000100','000110001000','000010000000'],
 source:['000111100000','001100110000','001000010000','000000110000','000001100000','000011000000','000011000000','000000000000','000011000000'],
 draw:['000011000000','000011000000','001111110000','011000011000','110000001100','110110101100','110000001100','011111111000','001111110000'],
 switch:['000010000000','000011000000','111111100000','000011000000','000010000000','000000100000','000001100000','000011111110','000001100000','000000100000']
};
export function pixelIcon(kind){
 if(kind==='joystick'){
  const base=document.createElement('span');base.className='torch-stick';base.setAttribute('aria-hidden','true');
  const knob=document.createElement('span');knob.className='torch-stick-knob';base.append(knob);return base;
 }
 const el=document.createElement('span');el.className='pixel-icon';el.setAttribute('aria-hidden','true');
 const cells=[];for(const [y,row] of (glyphs[kind]||glyphs.leaf).entries())for(let x=0;x<row.length;x++)if(row[x]==='1')cells.push([x,y]);
 const minX=Math.min(...cells.map(c=>c[0])),minY=Math.min(...cells.map(c=>c[1])),maxX=Math.max(...cells.map(c=>c[0])),maxY=Math.max(...cells.map(c=>c[1])),unit=kind==='sound'?1:2;
 el.style.width=(maxX-minX+1)*unit+'px';el.style.height=(maxY-minY+1)*unit+'px';
 const bit=document.createElement('i');bit.style.width=bit.style.height=unit+'px';bit.style.boxShadow=cells.map(([x,y])=>`${(x-minX)*unit}px ${(y-minY)*unit}px 0 currentColor`).join(',');el.append(bit);return el;
}
export function iconButton(button,kind,label){button.replaceChildren(pixelIcon(kind));button.setAttribute('aria-label',label);button.title=label}
export function createInstrument(root){
 return state=>{
  const layout=state.habitatId==='estuary'?'legacy':'scales';
  if(root.dataset.layout!==layout){root.replaceChildren();root.dataset.layout=layout;if(layout==='legacy')root.innerHTML='<span id="meterTemp"></span><span id="meterWet"></span><span id="simDetail"></span>'}
  let rows=sceneInstrument(state,getLanguage());
  if(!rows)rows=isEstuaryObservation(state)?estuaryInstrument(state,getLanguage()):habitatConfig(state).metrics.map(key=>gameText('water:'+key,getLanguage())+' '+Math.round(state[key]));
  while(root.children.length<rows.length)root.append(document.createElement('span'));
  while(root.children.length>rows.length)root.lastElementChild.remove();
  rows.forEach((text,i)=>{root.children[i].textContent=getLanguage()==='isopod'?isopodNumbers(text):text;root.children[i].dataset.scale=i===3?'qualitative':'numeric'});
 };
}
