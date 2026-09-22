import {habitatConfig} from './habitats.mjs';
import {gameText} from './locales/game.mjs?v=aquatic-1';
import {getLanguage} from './i18n.mjs?v=aquatic-1';

// Tiny CSS pixel marks: no raster resources, system emoji, or smooth icon font.
const glyphs={
 pencil:['000000001100','000000011110','000000111100','000001111000','000011110000','000111100000','001111000000','001110000000','001000000000'],
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
const meterCopy={
 zh:{temp:'温度',wet:'湿度',ventLow:'通风微弱',ventMid:'通风适中',ventHigh:'通风较强',lightLow:'微光',lightMid:'柔光',lightHigh:'明亮'},
 en:{temp:'TEMP',wet:'HUMIDITY',ventLow:'LOW AIRFLOW',ventMid:'AIRFLOW OK',ventHigh:'HIGH AIRFLOW',lightLow:'DIM',lightMid:'SOFT LIGHT',lightHigh:'BRIGHT'},
 ja:{temp:'温度',wet:'湿度',ventLow:'通気 弱',ventMid:'通気 中',ventHigh:'通気 強',lightLow:'微光',lightMid:'柔光',lightHigh:'明るい'},
 isopod:{temp:'~o~',wet:'\\o/',ventLow:'<o  ~',ventMid:'<o>',ventHigh:'~  o>',lightLow:'o^  -',lightMid:'o^',lightHigh:'o^  o*'}
};
export function pixelIcon(kind){
 const el=document.createElement('span');el.className='pixel-icon';el.setAttribute('aria-hidden','true');
 const cells=[];for(const [y,row] of (glyphs[kind]||glyphs.leaf).entries())for(let x=0;x<row.length;x++)if(row[x]==='1')cells.push([x,y]);
 const minX=Math.min(...cells.map(c=>c[0])),minY=Math.min(...cells.map(c=>c[1])),maxX=Math.max(...cells.map(c=>c[0])),maxY=Math.max(...cells.map(c=>c[1])),unit=kind==='sound'?1:2;
 el.style.width=(maxX-minX+1)*unit+'px';el.style.height=(maxY-minY+1)*unit+'px';
 const bit=document.createElement('i');bit.style.width=bit.style.height=unit+'px';bit.style.boxShadow=cells.map(([x,y])=>`${(x-minX)*unit}px ${(y-minY)*unit}px 0 currentColor`).join(',');el.append(bit);return el;
}
export function iconButton(button,kind,label){button.replaceChildren(pixelIcon(kind));button.setAttribute('aria-label',label);button.title=label}
export function createInstrument(root){
 root.innerHTML='<span id="meterTemp"></span><span id="meterWet"></span><span id="simDetail"></span>';
 return state=>{if(habitatConfig(state).aquatic){const nodes=[...root.children];habitatConfig(state).metrics.forEach((key,i)=>{nodes[i].textContent=gameText('water:'+key,getLanguage())+' '+Math.round(state[key])});return}const c=meterCopy[getLanguage()]||meterCopy.zh;root.querySelector('#meterTemp').textContent=c.temp+' '+state.temp.toFixed(1)+'°C';root.querySelector('#meterWet').textContent=c.wet+' '+Math.round(state.humidity)+'%';root.querySelector('#simDetail').textContent=(state.vent>75?c.ventHigh:state.vent<40?c.ventLow:c.ventMid)+' · '+(state.light<30?c.lightLow:state.light>65?c.lightHigh:c.lightMid)};
}
