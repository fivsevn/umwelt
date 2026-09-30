export const ERRANDS=['东东去菜市场了。','东东去拿快递了。','东东去买花盆了。','东东去楼下散步了。','东东去朋友家看植物了。','东东去买鱼食了。','东东去车库找工具了。'];
export function makeResident(random=Math.random){let present=random()<.68,status='',remaining=0;
 function next(){status=present?'':ERRANDS[Math.min(ERRANDS.length-1,Math.floor(random()*ERRANDS.length))];remaining=present?120+random()*150:45+random()*75}next();
 return {get present(){return present},get status(){return status},get remaining(){return remaining},update(dt){remaining-=Math.max(0,dt);if(remaining>0)return false;present=!present;next();return true}};
}
