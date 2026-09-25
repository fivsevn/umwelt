import {encodeIsopodText} from '../../locales/isopod.mjs';
const rows={
 arrival:['这片沙里的住客','Residents of this sand','この砂の住人'],start:['去沙滩看看','Visit the sand','砂浜をのぞく'],
 hint:['按住沙面挖开；继续按住可提起，松开放下。平静的沙下也可能有住客。','Hold sand to dig; keep holding to lift, release to put down. Still sand may be occupied too.','砂を長押しして掘る。そのまま持ち上げ、離すと下ろす。静かな砂の下にも住人がいる。'],
 look:['看看沙子下面','Look beneath the sand','砂の下を見る'],wait:['等一道浪','Wait for a wave','波を待つ'],
 lookAfter:['手可以进入画面。沙子没有标出入口。','Your hand can enter the scene. The sand has not marked an entrance.','手は画面に入れる。砂に入口の印はない。'],
 waitAfter:['你把手留在外面。浪来的时候，也没有敲门。','You keep your hand outside. The waves do not knock either.','手を外に置く。波もノックはしない。'],
 'ending:title':['沙面重新平了','Level sand again','また平らな砂'],
 'ending:body':['你开始认得这片沙的颜色，也认得几种消失的方法。最后一页写完，沙里仍有没见过面的住客。','You begin to know the colour of this sand, and several ways of disappearing. The last page is finished; some residents remain unseen.','砂の色と、姿を消すいくつかの仕方を覚えた。最後の頁を書き終えても、まだ顔を見ていない住人がいる。'],
 'ending:line':['表面看起来，地方还很宽。','From the surface, there still seems to be plenty of room.','表面から見ると、まだ広く空いている。'],
 sand:['湿沙','Wet sand','湿砂'],water:['浅水','Shallows','浅水'],wave:['细浪','Small waves','小波']
};
const nodes=[
 [['看起来空着','Apparently empty','空いているように見える'],['这片湿沙没有门牌。有几只露在外面，另一些没有留下动静。按住一小块沙，可以看看下面。','This wet sand has no door numbers. A few bodies are visible; others leave no sign. Hold a patch to look underneath.','湿った砂には表札がない。外に見えるものも、気配を残さないものもいる。砂を長押しすると下を見られる。']],
 [['一点动静','A small movement','小さな動き'],['几粒沙挪了一下。你刚把视线移过去，那边又很平静了。','A few grains shift. By the time you look over, the patch is quiet again.','砂粒が少し動いた。目を向けたときには、もう静かになっている。']],
 [['没有门的住处','A home without a door','扉のない住まい'],['沙面可以很平，下面却不必空着。你熟悉的那种“有人在家”，在这里没有窗户可看。','The surface can be level without being empty below. There are no windows here to tell you who is home.','表面が平らでも、下が空とは限らない。誰かがいるか確かめる窓は、ここにはない。']],
 [['手的来处','Where the hand comes from','手の来る方'],['从你的方向看，下方叫作沙子。从沙子下面看，你的方向还没有名字。','From your side, below is called sand. From beneath the sand, your direction has not been named.','こちらから見ると、下は砂と呼ばれる。砂の下からは、こちらの方角にまだ名前がない。']],
 [['换一个地方','Another place','別の場所'],['同一片湿沙里，有地方正在露出身体，也有地方正在把身体收回去。空位没有保持很久。','Bodies appear in one part of the wet sand and disappear in another. Vacancies do not last long.','湿砂の一方で身体が現れ、別の場所で消えていく。空きは長く続かない。']],
 [['重新进去','Going back in','また潜る'],['埋进去的动作结束以后，沙面没有留下一个完整的句号。只有几粒沙，比刚才松一点。','When the burrowing ends, no full stop remains. Just a few grains, a little looser than before.','潜り終えても、砂に句点は残らない。さっきより少し緩んだ砂粒があるだけ。']],
 [['浪也来过','The wave visited too','波も来た'],['水越过低处的沙。它搬动东西的方式很熟练，没有先把名字记下来。','Water crosses the lower sand. It moves things with practice, without writing their names first.','水が低い砂を越える。名前を先に書かず、慣れた手つきで物を動かす。']],
 [['数到这里','Counting this far','ここまで数える'],['你可以数清此刻露在外面的身体。写下“总共”之前，笔在纸上停了一下。','You can count the bodies visible just now. Before writing “in total”, your pen pauses.','いま外に見える身体は数えられる。「全部で」と書く前に、ペンが止まる。']],
 [['表面照旧','The surface as usual','表面はいつも通り'],['最后看一眼，湿沙仍然像刚来时那样。你已经不太愿意把它叫作空地。','One last look: the wet sand resembles your first view. You are less inclined to call it empty ground.','最後に見る湿砂は、来たときと同じようだ。もうあまり空き地とは呼びたくない。']]
];
nodes.forEach(([title,prompt],i)=>{rows[`${i}:title`]=title;rows[`${i}:prompt`]=prompt});
export const sandText=(key,lang='zh')=>{const row=rows[key.replace(/^sand:/,'')];return !row?key:lang==='isopod'?encodeIsopodText(row[0]):row[{zh:0,en:1,ja:2}[lang]??0]};
export function sandScene(s){const i=Math.min(8,(s.day-1)*3+s.period);return {id:`sand:${i}`,kind:'aquatic',title:`sand:${i}:title`,text:`sand:${i}:prompt`,storyKey:`sand:${i}`,options:[{id:'sand-look',label:'sand:look',text:'sand:lookAfter',delta:{}},{id:'sand-wait',label:'sand:wait',text:'sand:waitAfter',delta:{quiet:1}}]}}
