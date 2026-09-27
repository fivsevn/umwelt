// The shared one-pixel speaker used by the observation toolbar and desktop.
export function soundIcon(){
 const rows=['000010000000','000110001000','111110000100','111110100100','111110100100','111110000100','000110001000','000010000000'];
 const el=document.createElement('span');el.className='pixel-icon';el.setAttribute('aria-hidden','true');el.style.width='10px';el.style.height='8px';
 const bit=document.createElement('i'),cells=[];bit.style.width=bit.style.height='1px';
 rows.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='1')cells.push(`${x}px ${y}px 0 currentColor`)}));
 bit.style.boxShadow=cells.join(',');el.append(bit);return el;
}
