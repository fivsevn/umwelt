// Calendar air is decorative, independent from precipitation and solar geometry.
export function calendarAir(month, festivals={}) {
  const petals=({3:.65,4:.3,5:.04})[Number(month)]||0;
  const result={petals,source:petals?'month':'none'};
  // Reserved festival air uses one bounded override, never a stack of emitters.
  // All current festival slots are null until their artwork is approved.
  const override=festivals.airSlots?.find(slot=>slot?.kind==='petals'&&Number.isFinite(slot.amount));
  if(override){result.petals=Math.max(0,Math.min(.8,override.amount));result.source='festival';}
  return result;
}
