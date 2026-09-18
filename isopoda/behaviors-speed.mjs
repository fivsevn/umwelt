// Thin runtime shim for the observation-speed control.
// Only specimen simulation is accelerated; the surrounding UI keeps normal time.
import {stepIndividuals as baseStepIndividuals} from './behaviors.mjs?v=molt-sequence-1';
export * from './behaviors.mjs?v=molt-sequence-1';

const clocks=new WeakMap();

function multiplier(){
  const value=Number(globalThis.__ISOPODA_HABITAT_SPEED__||1);
  return Number.isFinite(value)?Math.max(1,Math.min(64,value)):1;
}

export function stepIndividuals(group,context={}){
  const speed=multiplier();
  const time=Number(context.time||0);
  let clock=clocks.get(group);
  if(!clock||clock.last===null||time<clock.last){
    clock={last:time,virtual:time,previousVirtual:time};
  }else{
    const delta=Math.max(0,Math.min(.5,time-clock.last));
    clock.previousVirtual=clock.virtual;
    clock.virtual+=delta*speed;
    clock.last=time;
  }
  clocks.set(group,clock);

  if(speed===1)return baseStepIndividuals(group,{...context,time:clock.virtual});

  // Above 16x, split movement into several 16x-or-less passes. This keeps the intentionally
  // absurd turbo mode fast without turning one animation tick into a single giant teleport.
  const substeps=Math.max(1,Math.ceil(speed/16));
  const localSpeed=speed/substeps;
  const originalSpeeds=group.map(actor=>actor.speed);
  const from=Number.isFinite(clock.previousVirtual)?clock.previousVirtual:clock.virtual;
  try{
    for(let i=0;i<group.length;i++)group[i].speed=originalSpeeds[i]*localSpeed;
    let result;
    for(let step=1;step<=substeps;step++){
      const virtualTime=from+(clock.virtual-from)*(step/substeps);
      result=baseStepIndividuals(group,{...context,time:virtualTime});
    }
    return result;
  }finally{
    for(let i=0;i<group.length;i++)group[i].speed=originalSpeeds[i];
  }
}
