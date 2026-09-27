(() => {
  const tick=document.querySelector('#tick'),field=document.querySelector('#field');
  const ending=document.querySelector('#ending'),exit=document.querySelector('#exitTick');
  const tickContext=tick.querySelector('canvas').getContext('2d');
  const senses=document.querySelector('#senses'),paint=senses.getContext('2d');
  const hairLayer=document.createElement('canvas'),hairPaint=hairLayer.getContext('2d');
  hairLayer.id='hairLayer';hairLayer.setAttribute('aria-hidden','true');field.insertBefore(hairLayer,tick);
  let language='zh';
  try{const saved=localStorage.getItem('umwelt-desktop-language');if(['zh','en','ja'].includes(saved))language=saved;}catch{}
  const copy={zh:['環世界','对蜱虫而言，少数信号就是整个世界。','拖动蜱虫','返回 UMWELT','退出小游戏'],en:['Umwelt','For a tick, a few signals are the whole world.','Drag the tick','Return to UMWELT','Exit the encounter'],ja:['環世界','マダニにとって、わずかな信号が世界のすべて。','マダニをドラッグ','UMWELT に戻る','終了する']}[language];
  document.documentElement.lang=language==='zh'?'zh-CN':language;
  document.querySelector('#aboutTitle').textContent=copy[0];document.querySelector('.note').textContent=copy[1];
  [tick,document.querySelector('nav a'),exit].forEach((el,i)=>el.setAttribute('aria-label',copy[i+2]));
  function draw(moving = false, ctx = tickContext, clock = 0) {
    ctx.clearRect(0,0,28,28);
    ctx.save();ctx.translate(0,Math.round(Math.sin(clock*1.8)*.65));
    ctx.strokeStyle = '#879077';
    for (const side of [-1,1]) for (let i=0;i<4;i++) {
      const y=10+i*2, bend=Math.round(Math.sin(clock*(moving?7:2.5)+i*1.7+side)* (moving?2:1));
      ctx.beginPath();ctx.moveTo(14+side*2,y);ctx.lineTo(14+side*5,y+(i<2?-1:1));ctx.lineTo(14+side*7,y+(i<2?-3:3)+bend);ctx.stroke();
    }
    ctx.fillStyle='#a8ae93';ctx.fillRect(11,9,6,10);ctx.fillRect(12,8,4,12);
    ctx.fillStyle='#bdc2a7';ctx.fillRect(12,10,2,6);
    ctx.fillStyle='#7c876f';ctx.fillRect(13,6,2,3);ctx.restore();
  }
  let starSeed=74119;
  const starRandom=()=>((starSeed=Math.imul(starSeed,1664525)+1013904223>>>0)/4294967296);
  const stars=Array.from({length:62},()=>({x:starRandom(),y:starRandom(),phase:starRandom()*6.28,period:8+starRandom()*5,brightness:.6+starRandom()*.4}));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let phase='search',x=.5,y=.5,drag=null,hover=false,radar=0,elapsed=0,last=0,feedback=0;
  let explored=0,searchAge=0,dwell=0,reveal=0,heat=null,hairs=[],junction=null,vessels=[],nodes=[],fallAge=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function place(px,py){
    const r=field.getBoundingClientRect();x=clamp(px,24,r.width-24)/r.width;y=clamp(py,24,r.height-24)/r.height;
    tick.style.left=`${x*100}%`;tick.style.top=`${y*100}%`;
  }
  function release(){
    const previous=drag;drag=null;
    if(previous&&tick.hasPointerCapture(previous.id))tick.releasePointerCapture(previous.id);
    tick.classList.remove('dragging');draw();
  }
  function stage(value){release();phase=value;field.dataset.phase=value;hairLayer.hidden=value!=='hair';hover=false;dwell=0;}
  function reset(){stage('search');explored=searchAge=reveal=radar=0;feedback=0;tick.style.filter='none';heat=null;x=y=.5;place(x*field.clientWidth,y*field.clientHeight);}
  function startFall(){stage('fall');fallAge=0;x=.5;y=.1;place(x*field.clientWidth,y*field.clientHeight);field.focus({preventScroll:true});}
  function startHair(){
    stage('hair');junction={x:.3+Math.random()*.4,y:.3+Math.random()*.4};
    vessels=[];
    let seed=9183;
    const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
    nodes=[{x:.16,y:.13,z:.22},{x:.78,y:.16,z:.32},{x:.10,y:.76,z:.27},{x:.83,y:.83,z:.45},{x:.88,y:.44,z:.52},{x:.42,y:.09,z:.18},{x:.57,y:.88,z:.24},{x:.07,y:.42,z:.36},{x:.68,y:.30,z:.42},{...junction,z:1,main:true}];
    function grow(origin,angle,length,width,z,depth){
      const end={x:origin.x+Math.cos(angle)*length,y:origin.y+Math.sin(angle)*length};
      const turn=(rnd()-.5)*1.6;
      const c1={x:origin.x+Math.cos(angle+turn)*length*.32,y:origin.y+Math.sin(angle+turn)*length*.32};
      const c2={x:end.x-Math.cos(angle-turn*.6)*length*.32,y:end.y-Math.sin(angle-turn*.6)*length*.32};
      const points=[];
      for(let i=0;i<=24;i++){
        const t=i/24,u=1-t;
        points.push({x:u*u*u*origin.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*end.x,y:u*u*u*origin.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*end.y});
      }
      vessels.push({points,width,z,origin});
      if(depth>0){
        for(const index of [9,17]){
          const p=points[index],next=points[index+1];
          grow(p,Math.atan2(next.y-p.y,next.x-p.x)+(rnd()<.5?-1:1)*(.35+rnd()*.65),length*(.22+rnd()*.22),width*.38,z*.92,depth-1);
        }
      }
    }
    for(const node of nodes){
      const count=node.main?9:6;
      for(let arm=0;arm<count;arm++){
        const angle=arm*6.28/count+(rnd()-.5)*.55;
        grow(node,angle,node.main?1.2:.5+rnd()*.4,node.main?2.5+rnd()*2:.45+node.z*1.1,node.z,node.main?3:2);
      }
    }
    vessels.sort((a,b)=>a.z-b.z);
    hairs=[];
    for(let i=0;i<450;i++){
      const a=Math.random(),b=Math.random();
      const density=.45+.3*Math.sin(a*15+b*6)+.2*Math.cos(b*18-a*5);
      if(Math.random()>density)continue;
      hairs.push({x:a,y:b,length:75+Math.random()*75,lean:-11+Math.random()*22,light:Math.random(),phase:Math.random()*Math.PI*2,speed:.35+Math.random()*.4});
    }
    x=.25;y=.5;place(x*field.clientWidth,y*field.clientHeight);tick.focus({preventScroll:true});
  }
  function finish(){
    stage('done');ending.hidden=false;ending.style.opacity='0';
    draw(false,exit.querySelector('canvas').getContext('2d'));
    const fade=ending.animate([{opacity:0},{opacity:1}],{duration:2400,easing:'ease-in-out',fill:'forwards'});
    fade.finished.then(()=>{document.querySelector('#game').hidden=true;exit.focus({preventScroll:true});});
  }
  function hit(){if(phase!=='fall')return;if(Math.abs(y-.73)<=.055)startHair();else reset();}
  function onMove(px,py){const ox=x,oy=y;place(px,py);if(phase==='search')explored+=Math.hypot(x-ox,y-oy);dwell=0;}
  tick.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')hover=true;});
  tick.addEventListener('pointerleave',()=>hover=false);
  tick.addEventListener('pointerdown',e=>{
    if(e.button!==0||drag||!['search','hair'].includes(phase))return;
    const r=tick.getBoundingClientRect();drag={id:e.pointerId,dx:e.clientX-r.left-24,dy:e.clientY-r.top-24,touch:e.pointerType==='touch'};
    tick.setPointerCapture(e.pointerId);tick.classList.add('dragging');draw(true);e.preventDefault();
  });
  tick.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const r=field.getBoundingClientRect();onMove(e.clientX-r.left-drag.dx,e.clientY-r.top-drag.dy);});
  tick.addEventListener('pointerup',()=>{
    release();
  });
  for(const event of ['pointercancel','lostpointercapture'])tick.addEventListener(event,release);
  window.addEventListener('blur',()=>{release();hover=false;});
  field.addEventListener('pointerdown',e=>{if(phase==='fall'){e.preventDefault();hit();}});
  field.tabIndex=-1;
  document.addEventListener('keydown',e=>{
    if(phase==='fall'&&['Enter',' '].includes(e.key)&&!e.repeat){e.preventDefault();hit();return;}
    if(document.activeElement!==tick)return;
    const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(dirs[e.key]){e.preventDefault();hover=true;const d=dirs[e.key];onMove(x*field.clientWidth+d[0]*10,y*field.clientHeight+d[1]*10);}
  });
  tick.addEventListener('blur',()=>hover=false);
  new ResizeObserver(()=>{const r=field.getBoundingClientRect();if(!r.width||!r.height)return;senses.width=Math.round(r.width/2);senses.height=Math.round(r.height/2);place(x*r.width,y*r.height);}).observe(field);
  function heatField(w,h,cx,cy,alpha,rx,ry){
    for(let yy=Math.max(0,Math.floor(cy*h-ry*1.8));yy<Math.min(h,cy*h+ry*1.8);yy++)for(let xx=Math.max(0,Math.floor(cx*w-rx*1.8));xx<Math.min(w,cx*w+rx*1.8);xx++){
      const grain=(Math.sin(xx*127.1+yy*311.7)*43758.5453)%1;
      const noise=Math.abs(grain);
      const distance=Math.hypot((xx-cx*w)/rx,(yy-cy*h)/ry);
      const v=Math.exp(-distance*distance*3.5)*Math.max(0,1-distance/1.8);
      if(v<=0)continue;
      const core=Math.pow(v,1.5),highlight=Math.max(0,1-Math.hypot((xx-cx*w+rx*.15)/(rx*.5),(yy-cy*h+ry*.16)/(ry*.5)));
      const red=Math.round(116+core*99+highlight*25),green=Math.round(64+core*44+highlight*61),blue=Math.round(40+core*28+highlight*34);
      paint.fillStyle=`rgba(${red},${green},${blue},${Math.pow(v,.75)*alpha*(.55+noise*.2)})`;paint.fillRect(xx,yy,1,1);
    }
  }

  function frame(now){
    const dt=Math.min((now-last)/1000||0,.05);last=now;
    if(!document.hidden&&phase!=='done'){
      elapsed+=dt;draw(!!drag,tickContext,elapsed);
      const w=senses.width,h=senses.height,px=x*w,py=y*h;
      let confidence=0;
      if(phase==='search'&&heat)confidence=Math.max(0,1-Math.hypot((x-heat.x)*w,(y-heat.y)*h)/36)*radar;
      if(phase==='fall')confidence=Math.max(0,1-Math.abs(y-.73)/.055);
      if(phase==='hair')confidence=Math.max(0,1-Math.hypot((x-junction.x)*w,(y-junction.y)*h)/32);
      feedback+=(confidence-feedback)*Math.min(1,dt*9);
      tick.style.filter=feedback>.015 ? `brightness(${1+feedback*.65}) drop-shadow(0 0 ${1+feedback*2}px rgba(211,218,173,${feedback*.38}))` : 'none';
      paint.clearRect(0,0,w,h);
      if(phase==='search'){
        if(explored>.03)searchAge+=dt;
        if(!heat&&searchAge>=3&&explored>=.3){
          // Place the source across the field, independently of the sensing radius.
          heat={x:x<.5?.7+Math.random()*.15:.15+Math.random()*.15,y:y<.5?.65+Math.random()*.2:.15+Math.random()*.2,radius:17+Math.random()*7};
        }
        radar+=((hover||drag?1:0)-radar)*Math.min(1,dt*8);
        for(const star of stars){
          const twinkle=.5-.5*Math.cos(elapsed*Math.PI*2/star.period+star.phase);
          paint.fillStyle=`rgba(172,185,148,${radar*(.07+twinkle*.28)*star.brightness})`;
          paint.fillRect(Math.floor(star.x*w),Math.floor(star.y*h),1,1);
        }
        paint.lineWidth=.5;
        for(let i=0;i<8;i++){
          const age=((elapsed/9.6)+i/8)%1;
          // Spend the extra wave lifetime close to the animal; preserve outer spacing.
          const travel=age;
          const r=age<.25 ? age*40 : 10+Math.pow((age-.25)/.75,2.3)*55;
          const fade=Math.pow(1-travel,1.5)*Math.min(1,travel*12);
          paint.strokeStyle=`rgba(167,188,143,${radar*.48*fade})`;
          paint.beginPath();paint.ellipse(px,py,r,r*.72,0,0,Math.PI*2);paint.stroke();
        }
        paint.lineWidth=1;
        if(heat){
          reveal=Math.min(1,reveal+dt);
          const distance=Math.hypot((x-heat.x)*w,(y-heat.y)*h),signal=radar*Math.pow(Math.max(0,1-distance/58),1.5);
          heatField(w,h,heat.x,heat.y,reveal*signal,heat.radius,heat.radius*.7);
          if(distance<13){dwell+=dt;if(dwell>=1.2)startFall();}else dwell=0;
        }
      }else if(phase==='fall'){
        fallAge+=dt;y=.1+fallAge*.15;
        place(.5*field.clientWidth,y*field.clientHeight);
        const pulse=1+Math.sin(fallAge*1.7)*(reduced.matches?.018:.04);
        heatField(w,h,.5,.73,.88+Math.sin(fallAge*1.7)*.08,Math.min(40,w*.18)*pulse,Math.max(18,h*.055)*pulse);
        if(fallAge>(.9-.1)/.15)reset();
      }else if(phase==='hair'){
        const distance=Math.hypot((x-junction.x)*w,(y-junction.y)*h);
        // A slow, broad double pulse remains readable under reduced motion too.
        const beat=elapsed%2.8;
        const pulse=Math.exp(-Math.pow((beat-.65)/.32,2))+.34*Math.exp(-Math.pow((beat-1.22)/.38,2));
        for(const vessel of vessels){
          const points=vessel.points;
          for(let i=1;i<points.length;i++){
            const proximity=Math.pow(1-i/points.length,3);
            const trunk=vessel.width>1;
            paint.lineWidth=Math.max(.3,vessel.width*(.12+.88*proximity))*(1+pulse*.06);
            const opacity=(.12+pulse*.52)*(.5+vessel.z*.5)*(trunk?1.35:1);
            const x0=points[i-1].x*w,y0=points[i-1].y*h,x1=points[i].x*w,y1=points[i].y*h;
            const thickness=paint.lineWidth;
            const depth=.6+vessel.z*.4;
            if(trunk){
              // Offset dark side grounds the vessel under the skin; a narrow ridge catches light.
              paint.lineWidth=thickness+1.4;
              paint.strokeStyle=`rgba(5,9,7,${.28+proximity*.18})`;
              paint.beginPath();paint.moveTo(x0+1,y0+1.3);paint.lineTo(x1+1,y1+1.3);paint.stroke();
            }
            paint.lineWidth=thickness;
            paint.strokeStyle=`rgba(132,65,55,${opacity*depth})`;
            paint.beginPath();paint.moveTo(x0,y0);paint.lineTo(x1,y1);paint.stroke();
            if(trunk&&thickness>1){
              paint.lineWidth=Math.max(.35,thickness*.27);
              paint.strokeStyle=`rgba(197,117,88,${opacity*.46})`;
              paint.beginPath();paint.moveTo(x0-.35,y0-.45);paint.lineTo(x1-.35,y1-.45);paint.stroke();
            }
          }
        }
        // Smaller, dimmer distant junctions sit behind the main irregular hub.
        for(const node of nodes){
          const cx=node.x*w,cy=node.y*h,rx=node.main?9:3+node.z*5,ry=rx*.65;
          for(let yy=-Math.ceil(ry);yy<=ry;yy++)for(let xx=-Math.ceil(rx);xx<=rx;xx++){
            const theta=Math.atan2(yy/ry,xx/rx);
            const d=Math.hypot(xx/rx,yy/ry)/(1+.12*Math.sin(theta*3+.7));
            if(d>=1)continue;
            const light=Math.max(0,Math.sqrt(1-d*d)*.7-xx*.025-yy*.045);
            paint.fillStyle=`rgba(${Math.round(110+light*75)},${Math.round(54+light*42)},${Math.round(43+light*28)},${(1-d)*(.15+pulse*.85)*(.38+node.z*.62)})`;
            paint.fillRect(Math.round(cx)+xx,Math.round(cy)+yy,1,1);
          }
        }
        paint.lineWidth=1;
        if(distance<13){dwell+=dt;if(dwell>.65)finish();}else dwell=0;
        if(hairLayer.width!==w*2||hairLayer.height!==h*2){hairLayer.width=w*2;hairLayer.height=h*2;}
        hairPaint.clearRect(0,0,w*2,h*2);
        hairPaint.setTransform(2,0,0,2,0,0);
        for(const strand of hairs){
          const a=strand.x*w,b=strand.y*h;
          const sway=Math.sin(elapsed*strand.speed+strand.phase)*5+Math.sin(elapsed*.29+strand.phase*2);
          // Discrete pixel clusters: shaded root, curved body and a single-pixel tip.
          const rootWidth=strand.light>.6?3:2;
          const shades=['#292d20','#3b402c','#505338','#686747','#817b55'];
          const dither=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
          hairPaint.fillStyle='#353521';hairPaint.fillRect(Math.round(a*2)/2-1,Math.round(b*2)/2-1,rootWidth+1,3);
          for(let step=0;step<strand.length*4;step++){
            const t=step/(strand.length*4);
            // A quarter-ellipse: upright at the root, sweeping right to a near-horizontal tip.
            const angle=t*Math.PI*.5;
            const reach=strand.length*(.55+.18*strand.light);
            const baseY=b-strand.length*Math.sin(angle);
            const baseX=a+reach*(1-Math.cos(angle))+strand.lean*.12*t*t;
            const separation=Math.max(0,1-Math.hypot(baseX-px,baseY-py)/30)*16*t;
            const xx=Math.round((baseX+(sway+separation)*t*t)*2)/2,yy=Math.round(baseY*2)/2;
            const width=t<.3?rootWidth:t<.7?2:1;
            // Dither in strand coordinates, so the texture follows the hair without flicker.
            for(let column=0;column<width*2;column++){
              const row=Math.floor(step/2),threshold=dither[(row%4)*4+column%4]/16;
              const across=column/Math.max(1,width*2-1);
              const light=Math.max(0,Math.min(3.9,1.1+strand.light*.6+Math.sin(across*Math.PI)*1.5-t*.45));
              const low=Math.floor(light),shade=low+(threshold<light-low?1:0);
              if((column===width*2-1||t>.88)&&threshold>.68)continue;
              hairPaint.fillStyle=shades[shade];
              hairPaint.fillRect(xx+column*.5,yy,.5,.5);
            }
          }
        }
        hairPaint.setTransform(1,0,0,1,0,0);

      }
    }
    requestAnimationFrame(frame);
  }
  draw();hairLayer.hidden=true;field.dataset.phase=phase;requestAnimationFrame(frame);
})();
