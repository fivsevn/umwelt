const c=document.querySelector('#forest'),x=c.getContext('2d');c.width=320;c.height=260;
let seed=41;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
x.fillStyle='#101e19';x.fillRect(0,0,320,260);
for(let i=0;i<1900;i++){let a=rnd()*320,b=rnd()*260;if(a>45&&a<275&&b>50&&b<205&&rnd()<.98)continue;x.fillStyle=['#14271e','#193025','#203a29','#2a442e','#354c33'][i%5];x.fillRect(a|0,b|0,2+(rnd()*8|0),2+(rnd()*4|0))}
for(let side of [0,1])for(let n=0;n<11;n++){let a=side?320:0,b=n*27-20,len=22+rnd()*38;for(let j=0;j<len;j++){let xx=a+(side?-j:j),yy=b+j*.8;x.fillStyle='#29432d';x.fillRect(xx|0,yy|0,2,2);if(j%5===0){x.fillStyle=j%10?'#345338':'#203c2b';x.fillRect((xx-(side?0:10))|0,(yy-5)|0,12,3);x.fillRect(xx|0,(yy+3)|0,9,3)}}}
