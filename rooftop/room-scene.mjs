export const ROOM_LAYOUT=[['table',300,180],['teaset',300,175],['woodshelf',250,126],['storagechest',348,140],['gardenbench',348,228],['pigbowl',250,285],['stool',270,225],['mint',250,110]].map(([type,x,y],i)=>({type,x,y,scale:1,rotation:0,id:'room-default-'+i,...(type==='mint'?{seed:712388}: {})}));
export function paintRoomBase(c){const px=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};px(0,0,640,520,'#aaa994');px(211,65,178,272,'#787b66');px(216,70,168,262,'#c6bea4');px(220,104,160,224,'#b0a48c');for(let y=104;y<328;y+=16)for(let x=220;x<380;x+=32){px(x,y,31,15,(x+y)%3?'#b4a991':'#ab9d84');px(x,y,32,1,'#c7bba1');px(x+31,y,1,16,'#998e76')}
// Ordered two-colour dithering follows the light and worn material edges.
for(let y=72;y<104;y++)for(let x=220;x<380;x++)if((x+y)%2===0&&((y>94)||(x<228)||(x>372)))px(x,y,1,1,'#b5ad93');
for(let y=105;y<328;y++)for(let x=220;x<380;x++){const edge=Math.min(x-220,379-x),grain=(x*17+y*31)%97;if((edge<8&&(x+y)%2===0)||grain<4)px(x,y,1,1,'#9d937d');else if(grain>93)px(x,y,1,1,'#c0b49b')}
px(272,74,56,27,'#6b7567');px(275,77,50,21,'#9cae9f');for(let y=78;y<98;y+=4){px(275,y,50,2,'#c1c9ad');px(275,y+2,50,1,'#7c8e7e');for(let x=276;x<325;x+=2)px(x,y,1,1,'#aab89e')}px(298,77,2,21,'#d0cfad');px(326,79,1,18,'#716f59');px(325,96,3,2,'#a59976');px(216,328,168,4,'#847b64');
// A quiet timber doorway sits in the left wall, clear of the window.
px(214,248,17,54,'#555e4d');px(216,250,13,50,'#b5a17d');px(218,252,9,46,'#8e7d60');px(219,253,7,1,'#c0ab84');px(219,254,1,42,'#aa9570');px(225,254,1,42,'#73654f');for(let y=257;y<295;y+=9){px(220,y,5,1,'#b49d76');px(220,y+1,5,1,'#7e6f55')}for(let y=254;y<296;y++)if(y%3===0)px(222+(y%2),y,1,1,'#a38d68');px(224,278,2,3,'#d3ba7f');px(224,279,1,1,'#ede0ab');px(214,301,18,2,'#c9bc9a');px(215,303,16,1,'#8f846b');}

export const INDOOR_FURNITURE=['table','bench','stool','woodshelf','foldingchair','gardenbench','storagechest','bistrotable','teaset','pigbowl','tasklamp','towel','wardcase'];
