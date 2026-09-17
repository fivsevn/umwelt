// Species size is a display layer, separate from morphology proportions and growth stage.
// 14 mm is the neutral render reference. The exponent compresses real millimetre differences so
// small taxa remain legible and giant taxa do not dominate the 384 px habitat. Unknown sizes stay 1×.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function documentedAdultLength(species){
 const direct=Number(species?.profile?.adultLengthMm);
 if(Number.isFinite(direct)&&direct>0)return direct;
 const range=species?.profile?.adultLengthRangeMm;
 if(Array.isArray(range)&&range.length>=2){
  const a=Number(range[0]),b=Number(range[1]);
  if(Number.isFinite(a)&&a>0&&Number.isFinite(b)&&b>0)return (a+b)/2;
 }
 return null;
}
export function speciesDisplayScale(species){
 const mm=documentedAdultLength(species);
 return mm?clamp(Math.pow(mm/14,.34),.82,1.30):1;
}
