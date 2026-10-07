import { modelRandom } from './model-random.mjs';

// The seed belongs to the object, not its world position or render frame.
export function surfaceSeed(seed=1835) {
  return modelRandom((seed || 1835) ^ 0x74e12b9)();
}

export function soilParticles(radius, seed, {dry=false, rectangular=false, trough=false}={}) {
  const random=modelRandom((seed || 1835)^0x137bc59), particles=[];
  const colors=dry?['#bbab84','#96866c','#d0b992','#756a54']:
    ['#665239','#493d2d','#817053','#a49775'];
  for(let i=0;i<(dry?34:25);i++) {
    const angle=random()*Math.PI*2, reach=Math.sqrt(random())*.80,
      x=rectangular?(random()-.5)*radius*(trough?2.55:1.50):Math.cos(angle)*reach*radius,
      z=rectangular?(random()-.5)*radius*(trough?1.00:1.15):Math.sin(angle)*reach*radius,
      size=radius*(dry?.022+random()*.032:.025+random()*.039);
    particles.push({x,z,size,height:size*(.25+random()*.24),color:colors[Math.floor(random()*colors.length)]});
  }
  return particles;
}
