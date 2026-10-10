// Open lattice: broad pots span the gaps; small bases must land on a bar.
// The same dimensions describe the drawn rails and placement support.
export const RACK_GRID=Object.freeze({pitch:.5,bar:.375,axis:"z"});
export function rackBars(width,depth) {
  const x=[],z=[];
  for(let i=-Math.floor(depth*.40/RACK_GRID.pitch);i<=Math.floor(depth*.40/RACK_GRID.pitch);i++)z.push(i*RACK_GRID.pitch);
  return {x,z,...RACK_GRID};
}
export function latticeSupports(footprint,lattice) {
  const distance=v=>Math.abs(v-Math.round(v/lattice.pitch)*lattice.pitch);
  if(footprint.d>=lattice.pitch-lattice.bar)return true;
  return distance(footprint.z)<=lattice.bar/2;
}
