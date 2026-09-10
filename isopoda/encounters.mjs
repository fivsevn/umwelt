// GAME: authored observational choreography, not claims about species social cognition.
// Each seed gives a 24-scene permutation; a 21-observation run never repeats an encounter.
export const ENCOUNTERS=[
 {id:'antenna',motion:'contact',actors:2,place:[174,145],title:'触角之间',lines:['两根触角碰了一下。身体都停住了，随后各自转向。','它们在叶缘相遇，接触短得不足以替它们起一个关系的名字。'],quiet:'它们自行错开。刚才的接触没有留下凭据。',care:'新的湿痕把两条路线分开；相遇留在它们身后。',disturb:'盒壁轻响以后，两根触角先收了回去。'},
 {id:'following',motion:'follow',actors:3,place:[250,320],title:'同一条路',lines:['前一只沿叶脉走，后两只隔着一小段距离经过。','三只先后拐过同一粒石子。队伍也许只是地形的另一种写法。'],quiet:'最前面的先拐弯，后面的绕去了另一边。所谓队伍到这里为止。',care:'多出来的叶片给了最后一只另一条路。',disturb:'它们散开了。刚才看起来一致的方向并没有被保存。'},
 {id:'meal',motion:'feed',actors:3,place:[316,253],title:'同一片边缘',lines:['三只停在食物的不同边缘，缺口缓慢地向里靠近。','它们围着同一小片食物。没有一只坐在桌子的主位。'],quiet:'缺口变深了一点。它们之间的距离没有因此缩短。',care:'补上的食物让一只转了向，另外两只仍停在旧缺口旁。',disturb:'那一圈身体松开了；食物还在中央。'},
 {id:'shelter',motion:'gather',actors:4,place:[188,220],title:'阴影的容量',lines:['几只依次进入同一块木片下面，入口没有随之变大。','四个轮廓在阴影边缘靠拢。你无法从这里看见它们之间的距离。'],quiet:'最后一只也移进暗处。入口重新像一个空的入口。',care:'叶片撑出一条新缝，其中一只停在了新的边界。',disturb:'遮蔽物一动，暗处便分成了几条向外的路线。'},
 {id:'yield',motion:'yield',actors:2,place:[258,170],title:'窄处',lines:['两只在根旁相向而行。一只先停下，另一只从旁边过去。','窄缝只够一只身体通过。先到的却先退了半步。'],quiet:'停下的那只重新向前。让路这个词仍属于你。',care:'你改变了入口；它们不必再经过同一个窄处。',disturb:'两只都退开了。窄缝第一次暂时属于空气。'},
 {id:'bridge',motion:'climb',actors:2,place:[270,107],title:'叶片的另一面',lines:['一只越过翘起的叶缘，另一只从它下方穿过去。','同一片叶子，上面与下面各有一只；平面图暂时不够用。'],quiet:'它们从叶片的两边出来，像从未相遇。',care:'叶缘被撑高以后，下方的路线变得更宽。',disturb:'上面的退回叶背，下面的停在了缝口。'},
 {id:'clean',motion:'groom',actors:1,place:[120,315],title:'细小的整理',lines:['它停下来，把触角收近口器，随后换了另一根。','一段路走到一半，它开始清理自己。到达并不是唯一的事情。'],quiet:'它放下触角，沿着刚才的方向继续走。',care:'湿土变暗时，它仍在完成那一点细小的整理。',disturb:'清理中断了，触角先重新指向外面。'},
 {id:'molt-back',motion:'molt',molt:'posterior',actors:1,place:[148,236],title:'尚未离开的旧物',lines:['木片旁的一个后半身颜色较浅，近处留着薄薄的旧壳。','同一只身体，前后像隔着一小段时间。'],quiet:'它仍停在原处。你没有把等待记成一次故障。',care:'新遮蔽物留下更深的阴影，浅色后半身慢慢退了进去。',disturb:'它缩近木片，薄壳留在原来的地方。'},
 {id:'molt-front',motion:'molt',molt:'anterior',actors:1,place:[155,188],title:'另一半的时间',lines:['一个体的头部和前几节甲片显得柔浅，它没有急着离开。','这次浅色在前半身。变化不是同时抵达每一个地方。'],quiet:'它缓慢舒展触角，其余几只从远处经过。',care:'你留下安静的遮蔽；两种甲色还会并存一阵。',disturb:'光落下来时，柔浅的前半身先藏进缝里。'},
 {id:'old-shell',motion:'shell',actors:2,place:[130,250],title:'留下的形状',lines:['一只在薄壳旁停下，另一只绕了过去。','旧壳保留着身体的弧度，身体已经在别处。'],quiet:'薄壳边缘少了一点。你没能确认是哪一只留下的。',care:'新食物出现在旁边，一只离开旧壳，另一只仍没有动。',disturb:'轻微的震动把它们分开，空壳没有移动。'},
 {id:'border',motion:'border',actors:2,place:[80,118],title:'两种土',lines:['湿土与干土相接的地方，两只反复停下、转向。','它走到土色变浅的地方，又折回来。边界没有画线。'],quiet:'一只留在湿边，另一只继续向前。',care:'水让边界向外挪了一点，触角很快到达新的位置。',disturb:'它们沿相反的方向离开了这条无形的线。'},
 {id:'curl',motion:'defend',actors:2,place:[285,340],title:'把外面留在外面',lines:['一只忽然收紧身体，旁边的个体绕出一个小弧。','它把轮廓收拢了一些。你还没有找到那个使它这样做的理由。'],quiet:'轮廓慢慢展开，触角重新伸向外面。',care:'新的遮挡投下阴影，它在暗处稍稍舒展开。',disturb:'它继续保持收拢。另一只已经离开。'},
 {id:'emerge',motion:'emerge',actors:3,place:[210,239],title:'出来的次序',lines:['先是触角，然后是头，接着才是其余的身体。三只并没有一起出来。','木片边缘接连出现几个轮廓，每一个都有自己的停顿。'],quiet:'最后一只终于出来，先出来的已经换了地方。',care:'叶子落下的位置成了它们新的停靠处。',disturb:'尚未露出的身体退回去了。你只看见一次没有完成的出现。'},
 {id:'circle',motion:'orbit',actors:2,place:[105,92],title:'绕过',lines:['两只从石粒的两侧绕行，短暂地彼此消失。','同一粒石子把一条路分成两条，又在背后合起来。'],quiet:'它们在石子另一侧重新可见，却没有走向彼此。',care:'地面多了一片叶，它们各自绕了更远的一点。',disturb:'一只中途折返，圆圈没有闭合。'},
 {id:'rest',motion:'rest',actors:3,place:[171,205],title:'没有发生的片刻',lines:['三只停在木片边。只有偶尔一次触角的变化能说明时间仍在走。','它们停得很久，长到你开始把自己的着急写进观察。'],quiet:'过了一会儿，其中一只换了一个朝向。',care:'新的阴影盖住它们。停留没有立即结束。',disturb:'它们一起动了；这一回，变化来自盒子外面。'},
 {id:'leaf-under',motion:'under',actors:2,place:[286,340],title:'纸一样的屋顶',lines:['叶片下有一只，叶片边还有一只。屋顶也许只是地面翘起的一部分。','一只钻进薄叶下面，尾端在外面多留了一会儿。'],quiet:'最后一点尾端消失了，叶片看起来恢复了原状。',care:'多出来的支点让入口没有完全贴地。',disturb:'叶片一抬，它们各自寻找了另一个下方。'},
 {id:'touch-return',motion:'contact',actors:3,place:[203,132],title:'短暂的三角',lines:['三条路线在一处接近，最小的一只先转开。','它们碰到彼此，又碰到同一粒土。你暂时没有把两种接触分开命名。'],quiet:'三条路线重新分开，没有留下一个共同的方向。',care:'湿痕使其中一条路线弯向左边。',disturb:'三只同时退开，随后以不同的速度离去。'},
 {id:'root',motion:'climb',actors:1,place:[292,186],title:'上方也有地面',lines:['它沿着根的一侧抬高身体，又从另一侧落回土里。','一小段隆起使它走出了纸面。'],quiet:'它跨过根，触角先碰到另一边的土。',care:'叶片搭在根边，多出一条缓一点的坡。',disturb:'它从半途退下来，没有再次尝试同一个角度。'},
 {id:'separate-meals',motion:'feed',actors:2,place:[303,265],title:'各自的缺口',lines:['两只背对背停在食物旁，咬出的缺口彼此看不见。','同一片食物正在从两个方向变小。'],quiet:'它们仍各自面对自己的边缘。',care:'新的碎屑落在旁边，其中一只移过去了。',disturb:'两个缺口都暂时停止扩大。'},
 {id:'departure',motion:'disperse',actors:4,place:[202,232],title:'离开的差别',lines:['木片边的几个体渐渐散开。没有一个可见的信号宣布结束。','聚在一起时不曾一起到来，离开时也没有统一的时刻。'],quiet:'最后一只仍停在原处，阴影还够它使用。',care:'新叶子截住了一条离开的路线。',disturb:'离开突然快了起来，你在记录旁多留了一点空白。'},
 {id:'parallel',motion:'parallel',actors:2,place:[241,304],title:'并行',lines:['两只沿着叶缘平行移动，始终隔着一粒土的距离。','它们朝同一方向走，却没有靠近。'],quiet:'叶缘结束时，两条路也分开了。',care:'新叶片延长了其中一条边缘。',disturb:'一只停下，另一只继续向前。'},
 {id:'wall',motion:'wall',actors:1,place:[336,165],title:'透明的尽头',lines:['触角碰到了盒壁。身体慢一点才开始转向。','它沿着透明的边走；你看得见的外面，不是它可以走到的地方。'],quiet:'它顺着盒壁转过一个角，又回到土上。',care:'叶缘离盒壁近了一点，它转向那道阴影。',disturb:'轻响从透明的那一边传来，它退开了。'},
 {id:'younger',motion:'follow',actors:2,place:[133,312],title:'不同的尺度',lines:['较小的一只穿过缝隙，较大的沿外缘绕行。','同一片碎叶，对两个体来说并不是同样大的障碍。'],quiet:'它们在另一边出现，先后次序已经倒过来。',care:'叶片多了一点高度，较大的也试着靠近。',disturb:'两个轮廓都停下，大小没有替它们决定下一步。'},
 {id:'threshold',motion:'hesitate',actors:1,place:[126,207],title:'还没有进去',lines:['它在入口前停了又停。身体已经朝向里面，触角仍留在外面。','入口在这里，它却向旁边探了一点。方向没有立刻成为决定。'],quiet:'它终于钻进去，留下一个普通的空入口。',care:'新的遮挡让入口变暗，它随之向前了一点。',disturb:'它换了方向。刚才的朝向没有成为一条承诺。'}
];
function hash(seed,n){let x=(seed+Math.imul(n+1,2654435761))>>>0;x=Math.imul(x^(x>>>16),2246822507);return (x^(x>>>13))>>>0}
export function encounterFor(state){const order=ENCOUNTERS.map((e,i)=>({e,key:hash(state.seed,i+401)})).sort((a,b)=>a.key-b.key);return order[((state.day-1)*3+state.period)%order.length].e}
export function responseMode(id){return ['lift','remove','wet-all'].includes(id)?'disturb':['mist','wet-left','food','leaf','gap','flat','shade','air','clean'].includes(id)?'care':'quiet'}
export function encounterText(e,seed){return e.lines[hash(seed,73)%e.lines.length]}
export const encounterById=id=>ENCOUNTERS.find(e=>e.id===id);
