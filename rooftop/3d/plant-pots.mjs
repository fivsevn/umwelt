// Root bases fit the soil opening. Leaf tips can overhang as living foliage does.
export function plantPotSpec(p) {
 const f=p.form,base=Math.min(.63,(p.w||24)/64+.07);
 const wide=/barrel|agave|swords|jade|hosta|rosette|exp-(stones|jaws|broad-moss|cushion|sphagnum)/.test(f);
 const trailing=/tails|ivy|exp-(beadtail|threads|segments|fishbone)/.test(f);
 const radius=f==='barrel'?.86:wide?Math.max(.67,base):trailing?.60:Math.max(.49,base);
 return {radius,height:.38,grit:p.family==='dry',trailing};
}
