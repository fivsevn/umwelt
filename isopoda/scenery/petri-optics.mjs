// Authored eyepiece effects: field curvature, edge dispersion and defocus halos.
// This is a visual simulation, not a calibrated optical measurement.
import {focusTarget} from './petri.mjs';
export function opticalField(source,target,w,h,m){
 const cx=w/2,cy=h/2,r=Math.min(w,h)*.445,error=(m.focus-focusTarget(m))/50,defocus=Math.min(1,Math.max(0,(Math.abs(m.focus-focusTarget(m))-5)/30)),illum=(m.light-60)/70;
 const read=(x,y,c)=>source[(Math.max(0,Math.min(h-1,Math.round(y)))*w+Math.max(0,Math.min(w-1,Math.round(x))))*4+c];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const dx=(x-cx)/r,dy=(y-cy)/r,rho=Math.hypot(dx,dy),edge=Math.min(1,rho),i=(y*w+x)*4;
  if(rho>1){target[i]=22;target[i+1]=32;target[i+2]=27;target[i+3]=255;continue}
  const bend=1+.035*edge**3+.055*error*edge**2,sx=cx+dx*r*bend,sy=cy+dy*r*bend;
  const dispersion=.35+edge**3*2.4+defocus*4.5,halo=(3+edge*3.2)*defocus;
  const falloff=1-.24*edge**6,contrast=1-.38*defocus,light=Math.max(.3,1+illum*.48);
  for(let c=0;c<3;c++){
   const shift=(c===0?1:c===2?-1:0)*dispersion,px=sx+dx*shift,py=sy+dy*shift;
   const center=read(px,py,c),around=(read(px+halo,py,c)+read(px-halo,py,c)+read(px,py+halo,c)+read(px,py-halo,c))/4;
   const rim=read(px+error*3+dx*halo*2,py+error*1.4+dy*halo*2,c);
   const value=(center*(1-defocus*.8)+around*defocus*.55+rim*defocus*.25-112)*contrast+112;
   target[i+c]=Math.max(0,Math.min(255,value*falloff*light+Math.max(0,illum)*14));
  }
  // Restrained cool/warm rim, stronger when the focal plane is misplaced.
  const fringe=Math.max(0,(edge-.962)/.038)*(8+defocus*16);
  target[i]+=fringe*.5;target[i+1]+=fringe*.65;target[i+2]+=fringe;
  target[i+3]=255;
 }
}
export function createPetriOptics(){
 const input=document.createElement('canvas'),output=document.createElement('canvas'),g=input.getContext('2d',{willReadFrequently:true}),out=output.getContext('2d');
 let frame;
 return (display,lens,m)=>{
  const w=Math.min(320,lens.width),h=Math.round(lens.height*w/lens.width);
  if(input.width!==w||input.height!==h){input.width=output.width=w;input.height=output.height=h;frame=out.createImageData(w,h)}
  if(!frame)frame=out.createImageData(w,h);
  g.imageSmoothingEnabled=false;g.drawImage(lens,0,0,w,h);
  opticalField(g.getImageData(0,0,w,h).data,frame.data,w,h,m);out.putImageData(frame,0,0);
  display.imageSmoothingEnabled=false;display.drawImage(output,0,0,lens.width,lens.height);
 };
}
