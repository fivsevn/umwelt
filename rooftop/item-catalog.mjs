import { ITEM_DATA } from './item-data.mjs';

// Items use one physical scale in all three axes. The building's historical
// coordinate conversion belongs to the background and must not deform pots.
export const ITEM_METRES_TO_UNITS = 5.6 / 3;
export const ITEM_CATALOG_REVISION = 'native-items-294-v1';
export const ITEMS = ITEM_DATA;
export const ITEM_ASSET_BASE_URL = new URL('./', import.meta.url);
const byId = new Map(ITEMS.map(item => [item.id, item]));
const byModel = new Map(ITEMS.map(item => [item.modelId, item]));

// These names accept explicitly imported historical arrangements. They are
// absent from the live catalog; old saved arrangements start from the empty
// baseline, as requested. New saves always contain canonical stable IDs.
export const LEGACY_ITEM_ALIASES = Object.freeze({
  shelf:'iron-3-black', tierstand:'iron-3-black', woodshelf:'wood-3',
  wirestand:'iron-3-silver', wallrack:'iron-4-black', coveredstand:'iron-4-black',
  ladderstand:'step-rack', plantcart:'iron-4-silver', basketstand:'plastic-basket-rack',
  table:'wood-square-table', pottingbench:'wood-square-table', lowplatform:'wood-square-table',
  bistrotable:'iron-round-table', bench:'wood-square-stool', stool:'wood-round-stool',
  stepstool:'wood-square-stool', ceramicseat:'plastic-round-stool', foamstand:'plastic-round-stool',
  gardenbench:'sofa-two', foldingchair:'wood-square-stool', 'room-armchair':'sofa-one',
  'room-bed':'bed-modern', 'room-wardrobe':'wardrobe-wood', 'room-dresser':'dresser-wood',
  sink:'steel-sink', basin:'enamel-basin', crate:'crate-blue', redbox:'crate-red',
  bucket:'plastic-bucket', rainbarrel:'galvanized-bucket', pot:'vessel-terra',
  enamelbowl:'enamel-basin', strainer:'seed-tray', wirebasket:'vessel-basket',
  'bamboo-basket':'vessel-basket', moss:'foam-soil', mossbox:'foam-soil',
  foambox:'foam-seedlings', seedtray:'seed-tray', fish:'aquarium-rectangle',
  fishbox:'aquarium-square', pond:'ceramic-fish-bowl', medakabowl:'ceramic-fish-bowl',
  goldfishbowl:'ceramic-fish-bowl', tools:'trowel', watering:'watering-can',
  hose:'hose-coil', sprayer:'trigger-sprayer', drying:'drying-rack',
  teaset:'tea-set', pigbowl:'enamel-basin', solarlamp:'solar-lamp',
  tinlantern:'tin-lantern', stringlights:'string-lights',
});
export function getItemDefinition(type) {
  return byId.get(type) || byModel.get(type) || byId.get(LEGACY_ITEM_ALIASES[type]);
}
export const getItemModelId = type => getItemDefinition(type)?.modelId;
export const canonicalItemId = type => getItemDefinition(type)?.id;
export function getVesselItemDefinition(potId) {
  return getItemDefinition('vessel-' + potId) || getItemDefinition(potId);
}

// Dimensions are metres here; placement and rendering multiply by the same
// ITEM_METRES_TO_UNITS and by the instance scale exactly once.
export function getPlantAssembly(type, potId) {
  const plant = getItemDefinition(type);
  if (plant?.category !== '植物') return null;
  const pot = getVesselItemDefinition(potId || plant.defaultPot);
  if (!pot) throw Error('缺少花盆：' + potId);
  const inside = pot.surfaces.find(surface => surface.container);
  const rim = inside?.rimHeight ?? pot.height;
  const soilTop = Math.max(inside?.height || 0, rim - Math.min(.012, Math.max(.004, rim * .04)));
  const reviewSoilTop = plant.reviewSoilTop || 0;
  const reviewCenter = plant.reviewVesselCenter || [0,0];
  const floorCenter = inside?.center || [0,0];
  return {
    plant, pot, soilTop, reviewSoilTop,
    // Runtime horizontal coordinates are native Blender X, -Y.
    foliageOffset:[floorCenter[0]-reviewCenter[0],soilTop-reviewSoilTop,-floorCenter[1]+reviewCenter[1]],
    height:Math.max(pot.height, soilTop + plant.height - reviewSoilTop),
    rigidBodyHeight:pot.height,
    opening:{width:inside?.openingWidth ?? pot.opening?.width ?? inside?.width ?? pot.width,
      depth:inside?.openingDepth ?? pot.opening?.depth ?? inside?.depth ?? pot.depth,
      shape:pot.opening?.shape || inside?.shape || 'circle', center:floorCenter},
  };
}
