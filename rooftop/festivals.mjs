import { chongchuanDate } from './climate.mjs';
// Empty decoration/air slots never enter the player's saved arrangement.
export const FESTIVALS = [
  ['new-year','元旦','solar',1,1,'common'], ['spring-festival','春节','lunar',1,1,'china'],
  ['lantern','元宵','lunar',1,15,'china'], ['dragon-boat','端午','lunar',5,5,'china'],
  ['qixi','七夕','lunar',7,7,'china'], ['mid-autumn','中秋','lunar',8,15,'china'],
  ['national-day','国庆','solar',10,1,'china'], ['double-ninth','重阳','lunar',9,9,'china'],
  ['valentine','情人节','solar',2,14,'western'], ['easter','复活节','easter',0,0,'western'],
  ['halloween','万圣夜','solar',10,31,'western'], ['thanksgiving','感恩节（美国）','thanksgiving',11,0,'western'],
  ['christmas','圣诞节','solar',12,25,'western'],
  ['hinamatsuri','女儿节（日本）','solar',3,3,'japan'], ['children-japan','儿童节（日本）','solar',5,5,'japan'],
  ['tanabata','七夕祭（日本）','solar',7,7,'japan'], ['obon','盂兰盆节（日本）','obon',8,13,'japan'],
  ['hanami','花见（日本·季节活动）','manual',0,0,'japan'],
].map(([id,name,calendar,month,day,group]) => Object.freeze({id,name,calendar,month,day,group,
  slots:Object.freeze({north:null,south:null,room:null}), airSlot:null, status:'reserved'}));
const lunar = new Intl.DateTimeFormat('en-u-ca-chinese', {timeZone:'Asia/Shanghai', month:'numeric', day:'numeric'});
// Gregorian Easter (Western calendar), not Orthodox Easter.
function easterDate(year) {
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,
    f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,
    i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;
  return {month:Math.floor(n/31),day:n%31+1};
}
let cachedDay = '', cachedMatches = [];
export function festivalsAt(date = new Date()) {
  const local = chongchuanDate(date), key = `${local.year}-${local.month}-${local.day}`;
  if (key !== cachedDay) {
    const parts = Object.fromEntries(lunar.formatToParts(date).map(p=>[p.type,p.value]));
    // Leap-month strings include a suffix; only plain month numbers match.
    const lunarMonth = /^\d+$/.test(parts.month) ? Number(parts.month) : 0, easter=easterDate(local.year);
    cachedMatches = FESTIVALS.filter(f => {
      if(f.calendar==='manual')return false;
      if(f.calendar==='easter')return local.month===easter.month&&local.day===easter.day;
      if(f.calendar==='thanksgiving')return local.month===11&&local.day>=22&&local.day<=28&&new Date(Date.UTC(local.year,10,local.day)).getUTCDay()===4;
      if(f.calendar==='obon')return local.month===8&&local.day>=13&&local.day<=16;
      return f.calendar==='solar' ? f.month===local.month&&f.day===local.day : f.month===lunarMonth&&f.day===Number(parts.day);
    });
    cachedDay = key;
  }
  return [...cachedMatches];
}
export function festivalContext(date, choice = 'auto') {
  const matches = choice === 'none' ? [] : choice === 'auto' ? festivalsAt(date) : FESTIVALS.filter(f=>f.id===choice);
  return {ids:matches.map(f=>f.id),names:matches.map(f=>f.name),decorationSlots:matches.map(f=>f.slots),airSlots:matches.map(f=>f.airSlot),reserved:true};
}
