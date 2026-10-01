// Dongdong: short chestnut hair, bare arms and a quiet, straight-cut dress.
// All poses share the rooftop's fixed overhead camera and muted pixel palette.
const PERSON_SCALE=1.5;
const palette={hair:'#685044',hairShade:'#4f4038',hairLight:'#856652',skin:'#bba387',skinShade:'#9e876f',dress:'#778578',dressShade:'#5c6d61',dressLight:'#94a08b',shoe:'#424b40'};
export function paintDongdong(c,p,time){const x=Math.round(p.x),y=Math.round(p.y),walk=p.state==='walk',step=walk?Math.floor(time*6)%2:0,north=p.facing==='north',side=p.facing==='east'||p.facing==='west',sign=p.facing==='west'?-1:1,bend=['prune','inspect','tend'].includes(p.state)?1:0,sway=walk?step:0;const r=(xx,yy,w,h,color)=>{c.fillStyle=color;const left=Math.round(xx*PERSON_SCALE),top=Math.round(yy*PERSON_SCALE);c.fillRect(x+left,y+top,Math.round((xx+w)*PERSON_SCALE)-left,Math.round((yy+h)*PERSON_SCALE)-top)},line=(ax,ay,bx,by,color)=>{const n=Math.max(Math.abs(bx-ax),Math.abs(by-ay),1);for(let i=0;i<=n;i++)r(ax+(bx-ax)*i/n,ay+(by-ay)*i/n,1,1,color)};
 r(-5,0,10,2,'#56634e');r(-3,-5+step,2,5-step,palette.skinShade);r(1,-5-step,2,5+step,palette.skin);r(-3,-1+step,3,2,palette.shoe);r(1,-1-step,3,2,palette.shoe);
 r(-3,-14+bend,6,8,palette.dress);r(-4,-8+bend,8,3,palette.dressShade);r(-3,-8+bend,6,2,palette.dress);r(-1,-12+bend,2,6,palette.dressLight);r(2,-12+bend,1,7,palette.dressShade);r(-1,-15+bend,2,2,palette.skin);r(-2,-14+bend,1,2,palette.skinShade);
 const working=p.state!=='walk'&&p.state!=='rest',arm=working?Math.round(Math.sin(time*3)):sway; r(-5,-13+bend,2,5+arm,palette.skinShade);r(3,-13+bend,2,5-arm,palette.skin);if(working)line(sign*4,-10+bend,sign*7,-9+arm,palette.skin);
 // The visible crown establishes the overhead angle; the nape stays short.
 r(-3,-20+bend,6,5,palette.skin);r(-4,-21+bend,8,3,palette.hair);r(-3,-22+bend,6,2,palette.hairShade);r(-3,-21+bend,4,1,palette.hairLight);r(-4,-19+bend,2,3,palette.hairShade);r(3,-19+bend,1,3,palette.hair);if(north){r(-3,-19+bend,6,3,palette.hair);r(-2,-16+bend,4,1,palette.hairShade)}else{r(side?sign*2:-1,-17+bend,1,1,palette.hairShade);r(-2,-19+bend,3,1,palette.hair)}
 if(p.state==='water'){r(sign>0?5:-11,-10,6,4,'#55786b');r(sign>0?10:-14,-10,4,2,'#829888');for(let i=0;i<3;i++)r(sign*(14+i),-7+(Math.floor(time*8)+i)%6,1,1,'#a7b9a0')}
 if(p.state==='sweep'){const sweep=Math.round(Math.sin(time*3)*3);line(sign*5,-10,sign*(9+sweep),0,'#89755c');r(sign>0?7+sweep:-13-sweep,0,6,2,'#a49473');r(sign>0?8+sweep:-12-sweep,2,4,1,'#786952')}
 if(p.state==='prune'){r(sign>0?7:-9,-9+arm,2,1,'#b5baaa');r(sign>0?9:-10,-8+arm,1,2,'#657850');if(Math.floor(time*2)%2)r(sign*10,-4+arm,1,2,'#82905e')}
 if(p.state==='tend'){r(sign>0?5:-8,-11,3,3,'#a49273');if(Math.floor(time*3)%2)for(let i=0;i<3;i++)r(sign*(9+i),-8+i*2,1,1,'#c1b287')}
 if(p.state==='wipe'){r(sign>0?6:-10,-10+arm,4,2,'#a4b3a7');r(sign>0?7:-9,-9+arm,2,1,'#7e978b')}
 if(p.state==='inspect'){r(sign>0?6:-9,-10+arm,3,2,palette.skin);r(sign>0?8:-10,-11+arm,1,2,palette.skinShade)}
 if(p.state==='rest'){r(-5,-10,2,2,palette.skinShade);r(3,-10,2,2,palette.skin)}
}
