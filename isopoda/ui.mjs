// Tiny CSS pixel marks: no raster resources, system emoji, or smooth icon font.
const glyphs={
 leaf:['000000001100','000000111100','000011111100','000111101100','001111011000','001110111000','001101110000','000011100000','000110000000','001100000000'],
 book:['011110111100','111110111110','110010100110','110010100110','110010100110','110010100110','111110111110','011110111100','000001000000'],
 sound:['000010000000','000110001000','111110000100','111110100100','111110100100','111110000100','000110001000','000010000000'],
 source:['000111100000','001100110000','001000010000','000000110000','000001100000','000011000000','000011000000','000000000000','000011000000'],
 draw:['000011000000','000011000000','001111110000','011000011000','110000001100','110110101100','110000001100','011111111000','001111110000'],
 switch:['000010000000','000011000000','111111100000','000011000000','000010000000','000000100000','000001100000','000011111110','000001100000','000000100000']
};
export function pixelIcon(kind){const el=document.createElement('span');el.className='pixel-icon';el.setAttribute('aria-hidden','true');const dots=[];for(const [y,row] of (glyphs[kind]||glyphs.leaf).entries())for(let x=0;x<row.length;x++)if(row[x]==='1')dots.push(`${x*2}px ${y*2}px 0 currentColor`);const bit=document.createElement('i');bit.style.boxShadow=dots.join(',');el.append(bit);return el}
export function iconButton(button,kind,label){button.replaceChildren(pixelIcon(kind));button.setAttribute('aria-label',label);button.title=label}
export function createInstrument(root){
 root.innerHTML='<span id="meterTemp"></span><span id="meterWet"></span><span id="simDetail"></span>';
 return state=>{root.querySelector('#meterTemp').textContent='温度 '+state.temp.toFixed(1)+'°C';root.querySelector('#meterWet').textContent='湿度 '+Math.round(state.humidity)+'%';root.querySelector('#simDetail').textContent='通风'+(state.vent>75?'较强':state.vent<40?'微弱':'适中')+' · '+(state.light<30?'微光':state.light>65?'明亮':'柔光')};
}
