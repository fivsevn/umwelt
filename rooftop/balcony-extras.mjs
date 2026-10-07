// Construction references are public maker/craft records; models are authored in code.
const ref=(label,url)=>({label,url});
export const BALCONY_EXTRAS = [
 ['bamboo-basket','提梁竹篮','小物',30,24,[30,23,18],ref('传统工艺青山 Square · 別府竹細工','https://kougeihin.jp/craft/0630/'),'疏编竹篮、厚实口沿和连续提梁，底部留出承托空间。'],
 ['broom','棕榈扫帚','小物',19,48,[19,10,45],ref('高田耕造商店 · 棕榈箒','https://takada1948.shop-pro.jp/?pid=179120790'),'棕榈纤维束、铜丝绑扎与长木柄；靠在自己的小支座上。'],
 ['pruning-shears','红柄园艺剪','小物',24,15,[24,14,4],ref('FELCO · FELCO 2','https://world.felco.com/en-gb/products/felco-2'),'弯刃、承刃、轴心螺母和两柄之间的弹簧，按园艺剪的结构绘制。'],
 ['pinwheel','四色纸风车','小物',22,37,[22,12,34],ref('おりがみくらぶ · 折纸图解','https://www.origami-club.com/'),'四片折起的纸叶围绕轴心展开；木杆插在一个小底座里。'],
 ['parasol','亚麻色遮阳伞','家具',66,63,[66,66,62],ref('IKEA · SAMSÖ','https://www.ikea.com/sg/en/p/samsoe-parasol-tilting-beige-10311817/'),'八片伞面、内侧伞骨、调节套环和加重底座；按阳台尺度调整比例。'],
 ['rainbarrel','带龙头雨水桶','器具',30,37,[30,30,35],ref('RHS · Collecting, storing and using water','https://www.rhs.org.uk/garden-jobs/water-collecting-storing-and-using'),'带盖的蓄水桶架在木台上，低位水龙头、接水入口与桶壁加强筋各自连接。'],
 ['stepstool','两级木踏凳','家具',29,34,[29,29,30],ref('IKEA · BEKVÄM 装配图','https://www.ikea.com/qa/en/assembly_instructions/bekvaem-step-stool-acacia__AA-444158-10-100.pdf'),'两级实木踏板、斜腿与横撑；上方留有提手孔，两层均可摆放小盆。'],
 ['windchime','铁铃与短册','小物',18,39,[18,14,36],ref('OIGEN · 南部铁器风铃目录','https://pro.oigen.jp/assets/file/oigen_item202409.pdf'),'参考南部铁器吊钟的开口钟体、吊绳和纸短册，配一个独立木支架。'],
].map(([id,name,category,w,h,dimensions,source,note])=>({id,name,category,w,h,dimensions,note,sources:[source],extra:true,furniture:category==='家具',care:'可在阳台自由陈列，叠放时让盆底落在承托面内。'}));

// Small code-drawn fallback for journal/canvas exports. Placed assets use the full 3D model.
export function paintBalconyExtra(c,a) {
 if(!a.extra)return false;
 const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))},line=(x,y,xx,yy,col,w=1)=>{
 const n=Math.max(Math.abs(xx-x),Math.abs(yy-y));for(let i=0;i<=n;i++)rect(x+(xx-x)*i/Math.max(1,n),y+(yy-y)*i/Math.max(1,n),w,w,col);
 };
 const wood='#92724a',light='#b79b6a',dark='#504d3d',teal='#537b74';
 if(a.id==='bamboo-basket'){rect(-13,-4,26,16,wood);for(let j=0;j<6;j++){rect(-12+j*5,-3,2,14,light);rect(-13,-2+j*3,26,1,dark)}for(const x of[-12,12])line(x,-2,x*.6,-18,wood,2);line(-7,-18,7,-18,light,2);rect(-14,-5,28,2,light)}
 else if(a.id==='broom'){rect(-1,-24,2,35,wood);for(let j=0;j<9;j++)line((j-4)*.8,4,(j-4)*2,23,j%2?wood:light,2);rect(-5,5,10,2,dark)}
 else if(a.id==='pruning-shears'){line(-9,7,0,-1,'#a86248',4);line(9,7,0,-1,'#b77454',4);line(0,-1,7,-8,'#aab3ad',3);line(0,-1,-3,-8,dark,2);rect(-1,-2,3,3,'#c9c9b3')}
 else if(a.id==='pinwheel'){rect(-1,-5,2,24,wood);for(let j=0;j<4;j++){const t=j*Math.PI/2;line(0,-12,Math.cos(t)*10,-12+Math.sin(t)*10,['#a76e52','#bdad71','#6c9290','#8d9570'][j],5)}rect(-1,-13,3,3,light)}
 else if(a.id==='parasol'){rect(-1,-18,2,45,wood);for(let j=0;j<15;j++)rect(-30+j*4,-23+Math.abs(j-7)*2,5,8,j%2?light:'#c9bc91');rect(-9,25,18,4,dark)}
 else if(a.id==='rainbarrel'){rect(-12,-17,24,35,teal);for(let j=0;j<5;j++)rect(-12,-14+j*6,24,2,'#6f9587');rect(-14,-20,28,4,dark);rect(10,10,7,3,light);for(const x of[-10,8])rect(x,18,3,5,wood)}
 else if(a.id==='stepstool'){rect(-13,-14,26,3,light);rect(-13,3,26,3,wood);for(const x of[-12,10])rect(x,-11,2,29,wood);rect(-11,15,22,2,dark);rect(-4,-14,8,1,dark)}
 else {rect(-8,-20,2,39,wood);rect(-6,-20,17,2,light);rect(7,-18,1,7,dark);for(let j=0;j<7;j++)rect(3-j*.3,-11+j,10+j*.6,1,teal);rect(7,-3,1,9,dark);rect(4,5,7,13,'#cbbd94');rect(5,8,1,7,'#667d73')}
 return true;
}
