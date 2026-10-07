import { VESSEL_ART } from './vessel-art.mjs';
export const VESSEL_SHAPES = new Set('oval bowl jar flare cylinder square mokko scallop footed cup pedestal rolled faceted irregular round shallow box bag deep basket'.split(' '));
export function vesselDimensions(p,r=.46,height=.38) {
 const art=VESSEL_ART[p.id];
 return art?{r,h:r*art.height,foot:r*(art.foot||0),art}:{r,h:height*(p.shape==='bag'?1.3:1),foot:0,art:null};
}
export function buildVessel(api,g,p,r=.46,height=.38,{empty=false}={}) {
 if(!VESSEL_SHAPES.has(p.shape))throw Error('未定义花盆器形：'+p.shape);
 const {box,beam,shade}=api,{h,foot,art}=vesselDimensions(p,r,height);
 const color=art?.body||p.color,rim=art?.rim||p.rim,top=foot+h;
 const kind=art?'vessel-'+p.id:p.shape==='bag'?'cloth':'enamel';
 if(art && api.profile) {
   const points=art.profile.map(([rr,y])=>[r*rr,foot+y*h,.16+y*.72]);
   const last=art.profile.at(-1)[0]*r,thick=r*(art.rolled?.095:p.id==='plastic'?.045:.065),floor=foot+Math.min(.055,h*.25);
   // Interior UVs select quiet glaze, never a duplicate of the exterior pattern.
   const innerUV=y=>art.interiorPaint ? .16+y*.72 : .02;
   points.push([last-thick,top,innerUV(1)]);
   for(let j=art.profile.length-2;j>0;j--){const[rr,y]=art.profile[j];points.push([Math.max(.08,rr*r-thick),Math.max(floor,foot+y*h),innerUV(y)])}
   points.push([Math.max(.08,art.profile[0][0]*r-thick),floor,.02],[.038,floor,.02],[.038,foot,.02],[art.profile[0][0]*r,foot,.16]);
   api.profile(g,points,art.sides,color,kind,art.shape||'round');
   const tr=thick*(art.rolled?1.35:.7),ry=art.rolled?tr*.52:Math.max(.012,r*.025);
   api.profile(g,[[last-thick,top-ry],[last+tr,top-ry],[last+tr,top],[last+tr*.7,top+ry],[last-thick*.6,top+ry],[last-thick,top-ry]],art.sides,rim,'enamel',art.shape||'round');
   if(foot) {
     if(art.feet)for(let j=0;j<art.feet;j++){const a=j*Math.PI*2/art.feet;api.profile(api.group?api.group(g,Math.cos(a)*r*.52,0,Math.sin(a)*r*.52):g,[[r*.09,0],[r*.14,foot*.15],[r*.13,foot],[r*.09,foot],[r*.07,0],[r*.09,0]],8,shade(color,.85),'clay');}
     else if(['tokoname','kutani','mino'].includes(p.id))for(const x of[-r*.48,r*.48])for(const z of[-r*.34,r*.34])box(g,x,foot*.5,z,r*.22,foot,r*.19,shade(color,.87),'clay');
     else api.profile(g,[[r*.38,0],[r*.43,r*.04],[r*.35,foot],[r*.28,foot],[r*.31,r*.04],[r*.33,0],[r*.38,0]],art.sides,rim,'enamel');
   }
   if(!empty)api.profile(g,[[.001,top-.062],[last-thick-.014,top-.062],[last-thick-.014,top-.040],[.001,top-.040],[.001,top-.062]],art.sides,'#655342','soil',art.shape||'round');
   if(p.id==='basket')for(const a of[0,2.094,4.189])beam(g,[Math.cos(a)*r,top,Math.sin(a)*r],[0,top+r*1.4,0],.023,'#6b7d70');
   return top;
 }
 if(/box|bag/.test(p.shape)) {
   const w=r*(p.id==='trough'?3.1:1.95),d=r*(p.id==='trough'?1.32:1.55),t=p.shape==='bag'?.045:.08;
   box(g,0,.04,0,w,.08,d,color,kind);
   for(const x of[-w/2,w/2])box(g,x,h/2,0,t,h,d,color,kind);
   for(const z of[-d/2,d/2])box(g,0,h/2,z,w,h,t,color,kind);
   for(const x of[-w/2,w/2])box(g,x,h,0,t*1.5,.05,d+t,rim,kind);
   for(const z of[-d/2,d/2])box(g,0,h,z,w+t,.05,t*1.5,rim,kind);
   if(p.shape==='bag')for(const x of[-w/2,w/2]){beam(g,[x,h*.65,-d*.15],[x,h+.15,-d*.15],.04,rim);beam(g,[x,h+.15,-d*.15],[x,h+.15,d*.15],.04,rim);beam(g,[x,h+.15,d*.15],[x,h*.65,d*.15],.04,rim)}
   if(p.id==='trough')for(let j=1;j<4;j++)for(const z of[-d*.52,d*.52])box(g,0,h*j/4,z,w,.015,.012,shade(color,.8),'wood');
   if(!empty)box(g,0,h-.05,0,w-t*2,.025,d-t*2,'#655342','soil');
   return h;
 }
 // Recording/2D-compatible fallback uses the same distinct colors and proportions.
 const sides=art?.sides||16,shape=art?.shape||p.shape;
 for(let j=0;j<8;j++)for(let k=0;k<sides;k++) {
   const t=(j+.5)/8,a=k/sides*Math.PI*2,rr=r*(.65+.35*t)*(shape==='mokko'?1+.12*Math.cos(a*4):1);
   box(g,Math.cos(a)*rr,foot+t*h,Math.sin(a)*rr*(shape==='oval'?.76:1),Math.PI*2*rr/sides,h/8+.001,.04,j===7?rim:color,kind,0,-a-Math.PI/2);
 }
 if(!empty)box(g,0,top-.05,0,r*1.2,.025,r*1.2,'#655342','soil');
 return top;
}
