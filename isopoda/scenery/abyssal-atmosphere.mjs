// Screen-space distant water: sparse enough to leave the seabed and animal dominant.
const hash=(i,seed)=>{let n=Math.imul(i+seed,374761393);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
export function drawAbyssalAtmosphere(g,{time=0,seed=57,width=384,height=430,reduced=false,avoid=null}={}){
 const t=time*(reduced?.65:1),unit=Math.max(1,Math.round(width/384));
 // Fade out well before entering the animal's reserved space, even while it moves.
 const clearance=(x,y)=>{
  if(!avoid)return 1;
  const d=Math.hypot((x-avoid.x)/avoid.rx,(y-avoid.y)/avoid.ry);
  return Math.max(0,Math.min(1,(d-1)/.35));
 };
 // Keep the middle open; stable positions prevent particles jumping as the animal walks.
 const distantPoint=n=>{
  const side=n%4,u=.06+((n>>>4)%880)/1000,v=.06+((n>>>14)%100)/1000;
  return side===0?{x:v*width,y:u*height}:side===1?{x:(1-v)*width,y:u*height}:side===2?{x:u*width,y:v*height}:{x:u*width,y:(1-v)*height};
 };
 g.save();
 for(let i=0;i<5;i++){
  const n=hash(i+19,seed),period=11+i*2,phase=(t+(n%130)/10)%period;
  if(phase>5.5)continue;
  const point=distantPoint(n),x=Math.round(point.x),y=Math.round(point.y),pulse=Math.sin(phase/5.5*Math.PI)**2*clearance(x,y);
  g.fillStyle=`rgba(208,236,233,${pulse*.95})`;g.fillRect(x,y,unit*2,unit*2);
  g.fillStyle=`rgba(147,201,208,${pulse*.48})`;
  g.fillRect(x-unit*2,y,unit*6,unit);g.fillRect(x,y-unit*2,unit,unit*6);
 }
 // One readable little ring at a time, with a quiet interval between appearances.
 const cycle=Math.floor(t/13),age=t%13,n=hash(cycle+83,seed);
 if(age<8){
  const point=distantPoint(n),x=Math.round(point.x+Math.sin(age*.6)*unit*2),y=Math.round(Math.max(height*.16,point.y)-age*4*unit),alpha=Math.sin(age/8*Math.PI)*.78*clearance(x,y);
  g.fillStyle=`rgba(185,220,225,${alpha})`;
  g.fillRect(x,y-unit*3,unit*3,unit);g.fillRect(x-unit,y-unit*2,unit,unit*4);g.fillRect(x+unit*3,y-unit*2,unit,unit*4);g.fillRect(x,y+unit*2,unit*3,unit);
 }
 g.restore();
}
