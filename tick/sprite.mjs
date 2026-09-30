// Shared with the encounter and desktop launcher; one 28 px tick drawing.
export function drawTick(ctx,{moving=false,clock=0}={}){
 ctx.clearRect(0,0,28,28);
 ctx.save();ctx.translate(0,Math.round(Math.sin(clock*1.8)*.65));
 ctx.strokeStyle='#879077';
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const y=10+i*2,bend=Math.round(Math.sin(clock*(moving?7:2.5)+i*1.7+side)*(moving?2:1));
  ctx.beginPath();ctx.moveTo(14+side*2,y);ctx.lineTo(14+side*5,y+(i<2?-1:1));ctx.lineTo(14+side*7,y+(i<2?-3:3)+bend);ctx.stroke();
 }
 ctx.fillStyle='#a8ae93';ctx.fillRect(11,9,6,10);ctx.fillRect(12,8,4,12);
 ctx.fillStyle='#bdc2a7';ctx.fillRect(12,10,2,6);
 ctx.fillStyle='#7c876f';ctx.fillRect(13,6,2,3);ctx.restore();
}
