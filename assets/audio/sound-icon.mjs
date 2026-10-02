// The shared one-pixel speaker used by the observation toolbar and desktop.
export function soundIcon(){
 const rows=['000010000000','000110001000','111110000100','111110100100','111110100100','111110000100','000110001000','000010000000'];
 const el=document.createElement('span');el.className='pixel-icon';el.setAttribute('aria-hidden','true');el.style.width='10px';el.style.height='8px';
 const bit=document.createElement('i'),cells=[];bit.style.width=bit.style.height='1px';
 rows.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='1')cells.push(`${x}px ${y}px 0 currentColor`)}));
 bit.style.boxShadow=cells.join(',');el.append(bit);return el;
}

// Fixed single-note pixels, independent of language fonts and external assets.
export function musicIcon(){
 const rows=['00010000','00011000','00011100','00010110','00010010','00010010','00010100','00010000','01110000','11110000','11100000','01000000'];
 const el=document.createElement('span');el.className='pixel-icon music-glyph';el.setAttribute('aria-hidden','true');el.style.width='8px';el.style.height='12px';
 const bit=document.createElement('i'),cells=[];bit.style.width=bit.style.height='1px';
 rows.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='1')cells.push(`${x}px ${y}px 0 currentColor`)}));
 bit.style.boxShadow=cells.join(',');el.append(bit);return el;
}
