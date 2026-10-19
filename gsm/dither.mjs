// Ordered 4x4 Bayer dithering. Integer pixels and discrete density bands,
// rather than a blurred gradient or random noise. Kept as editable SVG.
const bayer=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
export function ditherSVG(options={}){
 const w=options.width||80,h=options.height||80,px=Math.max(1,Math.round(options.ditherSize||2)),tile=px*4;
 const density=Math.max(0,Math.min(1,options.ditherDensity??.25)),mode=options.ditherMode||'flat';
 const id='dither-'+String(options.id||'tile').replace(/[^a-z0-9-]/gi,'');
 const bands=mode==='flat'?1:Math.max(1,Math.min(16,Math.floor(h/px))),defs=[],rects=[];
 for(let i=0;i<bands;i++){
  const amount=density*(mode==='fade-down'?(i+1)/bands:mode==='fade-up'?(bands-i)/bands:1),count=Math.round(amount*16),bits=[];
  for(let y=0;y<4;y++)for(let x=0;x<4;x++)if(bayer[y][x]<count)bits.push(`M${x*px} ${y*px}h${px}v${px}h-${px}Z`);
  defs.push(`<pattern id="${id}-${i}" patternUnits="userSpaceOnUse" width="${tile}" height="${tile}"><path d="${bits.join('')}" fill="currentColor"/></pattern>`);
  const y=Math.round(i*h/bands/px)*px,bottom=i===bands-1?h:Math.round((i+1)*h/bands/px)*px;
  rects.push(`<rect x="0" y="${y}" width="${w}" height="${Math.max(0,bottom-y)}" fill="url(#${id}-${i})"/>`);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges" aria-hidden="true"><defs>${defs.join('')}</defs>${rects.join('')}</svg>`;
}
