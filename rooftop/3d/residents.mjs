import { attachRaincoat } from '../fashion/raincoats.mjs';
import { wardrobe } from '../wardrobe.mjs';
import { buildFashionPerson, buildFashionPig } from '../fashion/models.mjs';
import { buildResidentTools } from './resident-tools.mjs';

function actorPrimitives(api) {
  return {...api,
    box(...args){if(!args[8]||args[8]==='plain')args[8]='actor-plain';return api.box(...args);},
    beam(g,a,b,width,color,depth=width,kind='actor-plain'){return api.beam(g,a,b,width,color,depth,kind);},
  };
}
export function buildResident(api,parent) {
  const authored=actorPrimitives(api),actor=buildFashionPerson(authored,parent,wardrobe.outfit);
  // The old resident was scaled 1.10; 1.16 gives a small, visible increase.
  actor.person.scale.setScalar(1.16);
  actor.personRaincoat=attachRaincoat(authored,actor,'person',wardrobe.outfit);
  actor.tools=buildResidentTools(authored,actor.arms);
  return actor;
}
export function buildPig(api,parent) {
  const authored=actorPrimitives(api),actor=buildFashionPig(authored,parent,wardrobe.pig);
  actor.pigRaincoat=attachRaincoat(authored,actor,'pig');
  return actor;
}
