// Shared by render and tests; timestamps never stay stuck at their example age.
export function postTime(post, language, now=Date.now()) {
 const date=new Date(post.createdAt), elapsed=Math.max(0,now-date.getTime());
 const minutes=Math.floor(elapsed/60000),hours=Math.floor(minutes/60),days=Math.floor(hours/24);
 if(minutes<1)return {zh:'刚刚',en:'Just now',ja:'たった今'}[language];
 if(minutes<60)return {zh:`${minutes} 分钟前`,en:`${minutes}m ago`,ja:`${minutes} 分前`}[language];
 if(hours<24)return {zh:`${hours} 小时前`,en:`${hours}h ago`,ja:`${hours} 時間前`}[language];
 if(days<7)return {zh:`${days} 天前`,en:`${days}d ago`,ja:`${days} 日前`}[language];
 return new Intl.DateTimeFormat({zh:'zh-CN',en:'en-GB',ja:'ja-JP'}[language],{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Shanghai'}).format(date);
}
