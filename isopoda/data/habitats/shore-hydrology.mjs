// Authored surface-water proxy, not a salt-wedge or measured estuary model.
// Negative displacement carries marine influence riverward (left).
export const shoreFrontOffset=(tide=0,rain=false)=>[-22,-76,18,72][tide]+(rain?48:0);
export function shoreMarineFraction(x,y,point=1,tide=0,rain=false,front=shoreFrontOffset(tide,rain)){
 const boundary=[326,192,35][point]+front+Math.sin(y*.022)*[30,61,24][point]+Math.sin(y*.009)*18;
 const eddy=Math.sin(x*.027+y*.018)*9+Math.sin(x*.011-y*.035)*7;
 const t=Math.max(0,Math.min(1,.5+(x-boundary+eddy)/150));
 return t*t*(3-2*t);
}
export const shoreLocalSalinity=(point,tide,rain)=>4+26*shoreMarineFraction(192,340,point,tide,rain);
