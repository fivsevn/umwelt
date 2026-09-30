export const ERRAND_POOLS={
 dawn:['东东去菜市场了。','东东去楼下散步了。'],
 morning:['东东去拿快递了。','东东去买花盆了。','东东去买鱼食了。'],
 day:['东东去吃午饭了。','东东去车库找工具了。'],
 afternoon:['东东去朋友家看植物了。','东东去买花盆了。','东东去拿快递了。'],
 dusk:['东东去楼下散步了。','东东去买晚饭了。'],
 evening:['东东去朋友家看植物了。','东东去楼下散步了。'],
 late:['东东去车库找工具了。']
};
export const ERRANDS=[...new Set(Object.values(ERRAND_POOLS).flat())];
export function makeResident(random=Math.random,{phase=()=> 'day'}={}){let present=random()<.68,status='',remaining=0;
 const pool=()=>ERRAND_POOLS[phase()]||ERRAND_POOLS.day;
 const choose=()=>{const options=pool();status=options[Math.min(options.length-1,Math.floor(random()*options.length))]};
 function next(){if(present)status='';else choose();remaining=present?120+random()*150:45+random()*75}next();
 return {get present(){return present},get status(){return status},get remaining(){return remaining},update(dt){remaining-=Math.max(0,dt);if(remaining>0){if(!present&&!pool().includes(status)){choose();return true}return false}present=!present;next();return true}};
}
