// Keep saved choices and old links usable after merging cloudy into overcast.
export function canonicalWeatherCondition(condition) {
  return condition === "cloudy" ? "overcast" : condition;
}
