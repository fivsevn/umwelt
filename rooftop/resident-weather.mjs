import { canonicalWeatherCondition } from "./weather-condition.mjs";
// One shared choice per continuous rain episode, including weather transitions.
export function createRainEpisode(random = Math.random) {
  let mode = null;
  return (weather) => {
    const wet = weather.rainIntent > 0 || weather.rain > .01 ||
      ['plum-rain', 'rain', 'heavy', 'thunderstorm', 'typhoon'].includes(weather.activityCondition || weather.condition);
    if (!wet) mode = null;
    else if (!mode) mode = random() < .5 ? 'raincoat' : 'shelter';
    return mode;
  };
}
// Weather changes actions and poses without changing the user's wardrobe or save.
export const WEATHER_ACTION_POOLS = {
  rain: {
    person: ["listen-rain", "dry-hands", "tea"],
    pig: ["watch-rain", "shake", "curl"],
  },
  heavy: {
    person: ["watch-rain", "warm-hands", "tea"],
    pig: ["curl", "snooze", "shake"],
  },
  thunderstorm: {
    person: ["comfort", "listen-rain", "warm-hands"],
    pig: ["huddle", "curl", "watch-rain"],
  },
  typhoon: {
    person: ["check-window", "comfort", "tea"],
    pig: ["huddle", "snooze", "curl"],
  },
  wind: {
    person: ["brace", "check-ties", "stretch"],
    pig: ["brace", "sniff-air", "ear-flick"],
  },
  mist: {
    person: ["warm-hands", "inspect", "look-out"],
    pig: ["sniff-air", "huddle", "ear-flick"],
  },
  overcast: {
    person: ["inspect", "stretch", "look-out"],
    pig: ["sniff", "ear-flick", "rest"],
  },
  clear: {
    person: ["stretch", "look-out", "tea"],
    pig: ["bask", "sniff", "snooze"],
  },
};
export const WEATHER_TASKS = {
  "listen-rain": "听雨",
  "watch-rain": "看着雨点",
  "dry-hands": "擦干手上的雨水",
  "warm-hands": "搓搓手",
  comfort: "陪小猪等雷雨过去",
  "check-window": "检查窗边",
  brace: "迎着风站稳",
  "check-ties": "看看花架上的系绳",
  stretch: "伸个懒腰",
  "look-out": "看看远处的楼",
  "sniff-air": "闻闻风里的气味",
  "ear-flick": "甩甩耳朵",
  sniff: "闻闻盆边",
  bask: "晒太阳",
  snooze: "打个盹",
  huddle: "缩到避风处",
  curl: "蜷起来休息",
  shake: "抖掉身上的水",
  "wipe-pot": "擦掉盆沿的雨水",
  "sniff-wet": "闻闻雨后的地面",
  "avoid-puddle": "绕开积水",
  "wipe-sweat": "擦擦汗",
};
export function weatherAction(
  state,
  actor,
  step,
  { sheltered = false, indoor = false, raincoat = false } = {},
) {
  const condition = canonicalWeatherCondition(state.activityCondition || state.condition);
  state = { ...state, condition: ({'plum-rain':'rain','partly-cloudy':'overcast',snow:'mist'})[condition] || condition };
  const rain =
    ["rain", "heavy", "thunderstorm", "typhoon"].includes(state.condition) ||
    state.rain > 0.01;
  if (rain && raincoat && !indoor) return {
    state: actor === 'pig' ? 'sniff-wet' : 'listen-rain',
    task: actor === 'pig' ? '穿着透明雨衣闻闻湿地面' : '穿着透明雨衣听雨',
  };
  if (rain && !sheltered && !indoor) return null;
  const actions =
    state.night > 0.5 && !rain
      ? actor === "pig"
        ? ["snooze", "curl", "ear-flick"]
        : ["tea", "stretch", "look-out"]
      : !rain && state.wetness > 0.15
        ? actor === "pig"
          ? ["sniff-wet", "avoid-puddle", "shake"]
          : ["wipe-pot", "inspect", "look-out"]
        : state.phase === "day" && state.condition === "clear"
          ? actor === "pig"
            ? ["bask", "snooze", "sniff"]
            : ["wipe-sweat", "tea", "look-out"]
          : (WEATHER_ACTION_POOLS[state.condition] || WEATHER_ACTION_POOLS.clear)[actor];
  const action = actions[Math.abs(step) % actions.length];
  return {
    state: action,
    task:
      WEATHER_TASKS[action] ||
      { tea: "喝一杯茶", inspect: "看看叶片和花盆", rest: "歇一会儿" }[action],
  };
}

// Describe the running actors, so this card never advertises an action while
// the character is walking somewhere else or has left home.
export function actionCaption(
  person,
  pig,
  { present = true, scene = "north", weather = {} } = {},
) {
  const action = (actor) =>
    (actor?.raincoat ? actor.task : null) ||
    WEATHER_TASKS[actor?.state] ||
    actor?.task ||
    {
      tea: "喝一杯茶",
      inspect: "看看叶片和花盆",
      rest: "歇一会儿",
      walk: "慢慢走走",
      idle: "歇一会儿",
      water: "给植物浇水",
      tend: "整理花盆",
      eat: "吃一点东西",
    }[actor?.state] ||
    "歇一会儿";
  const a = present ? `东东${action(person)}` : "东东出门了";
  const b = `小猪${action(pig)}`;
  const shelter =
    scene !== "room" && (weather.rain > 0.06 || weather.rainIntent > 0);
  return `${a}，${b}。${present && shelter && person?.sheltered && pig?.sheltered ? "两人在门边等雨停。" : ""}`;
}

// A card follows meaningful episodes, not every footstep or eight-second pose.
// In a wet episode it changes once when shelter is reached. Dry episodes also
// follow substantive work; walking between tasks keeps the previous caption.
export function createActionCard() {
  let key = "",
    text = "",
    sheltered = false,
    work = "";
  return {
    update(person, pig, context) {
      const weather = context.weather || {};
      const nextKey = [
        context.scene,
        context.present,
        canonicalWeatherCondition(weather.activityCondition || weather.condition),
        weather.phase,
        weather.rainMode,
      ].join(":");
      const wet =
        context.scene !== "room" &&
        (weather.rainIntent > 0 || weather.rain > 0.06);
      const settled = Boolean(person?.sheltered && pig?.sheltered);
      const nextWork = !wet && context.present &&
        ['water', 'prune', 'tend', 'wipe', 'sweep', 'wash', 'tea', 'sit', 'feed', 'inspect'].includes(person?.state)
          ? person.state : '';
      if (nextKey !== key || (wet && settled !== sheltered) || (nextWork && nextWork !== work)) {
        text = actionCaption(person, pig, context);
        if (nextKey !== key) work = '';
        key = nextKey;
        sheltered = settled;
        if (nextWork) work = nextWork;
      }
      return text;
    },
  };
}
