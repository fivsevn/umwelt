export const ERRAND_POOLS = {
  dawn: [
    "东东拎着布袋去菜市场挑青菜了，还要给小猪带一小块南瓜。",
    "东东去河边散步了，想看看昨天那只躲在桥下的白鹭还在不在。",
  ],
  morning: [
    "东东去驿站拿快递了，包裹里是小猪的新领巾和几包花种。",
    "东东骑电瓶车去花市挑花盆了，顺便问问老板那株薄荷怎么过冬。",
    "东东去买鱼食了。",
    "东东推着电瓶车去补胎了，回来还要给小猪添水。",
    "东东骑电瓶车去公园看新开的花了，回来的路上打算买一袋园艺土。",
  ],
  day: [
    "东东去图书馆还书了，借来的菜谱里夹着一片晒干的薄荷叶。",
    "东东去五金店买水龙头垫圈了，天台水池滴滴答答响了一上午。",
    "东东去吃午饭了。",
    "东东去车库翻旧木板了，想给小猪做一张晒太阳的小床。",
    "东东骑电瓶车去超市买南瓜和胡萝卜了，晚上想煮一锅软软的杂粮饭给小猪吃。",
  ],
  afternoon: [
    "东东骑电瓶车去花市挑花盆了，顺便问问老板那株薄荷怎么过冬。",
    "东东去驿站拿快递了，包裹里是小猪的新领巾和几包花种。",
    "东东骑电瓶车去超市买南瓜和胡萝卜了，晚上想煮一锅软软的杂粮饭给小猪吃。",
    "东东推着电瓶车去补胎了，回来还要给小猪添水。",
    "东东骑电瓶车去公园看新开的花了，回来的路上打算买一袋园艺土。",
    "东东去看电影了。",
  ],
  dusk: [
    "东东去河边散步了，想看看昨天那只躲在桥下的白鹭还在不在。",
    "东东去买晚饭的材料了，今天想做番茄面，小猪的饭另外煮。",
  ],
  evening: [
    "东东去河边散步了，想看看昨天那只躲在桥下的白鹭还在不在。",
    "东东骑电瓶车去超市买南瓜和胡萝卜了，晚上想煮一锅软软的杂粮饭给小猪吃。",
    "东东去看电影了。",
  ],
  late: ["东东去车库翻旧木板了，想给小猪做一张晒太阳的小床。"],
};
export const ERRANDS = [...new Set(Object.values(ERRAND_POOLS).flat())];
export function makeResident(
  random = Math.random,
  { phase = () => "day", environment = () => ({}) } = {},
) {
  const rainy = (w) =>
    w.rain > 0.06 ||
    ["rain", "heavy", "thunderstorm", "typhoon"].includes(w.condition);
  let present = rainy(environment()) || random() < 0.68,
    status = "",
    remaining = 0;
  const pool = () => ERRAND_POOLS[phase()] || ERRAND_POOLS.day;
  const choose = () => {
    const options = pool();
    status =
      options[
        Math.min(options.length - 1, Math.floor(random() * options.length))
      ];
  };
  function next() {
    if (present) status = "";
    else choose();
    remaining = present ? 120 + random() * 150 : 45 + random() * 75;
  }
  next();
  return {
    get present() {
      return present;
    },
    get status() {
      return status;
    },
    get remaining() {
      return remaining;
    },
    update(dt, weather = {}) {
      remaining -= Math.max(0, dt);
      if (remaining > 0) {
        if (!present && !pool().includes(status)) {
          choose();
          return true;
        }
        return false;
      }
      // Once home, wait out the rain instead of starting a gardening errand.
      if (present && rainy(weather)) {
        remaining = 30;
        return false;
      }
      present = !present;
      next();
      return true;
    },
  };
}
