// Atmosphere uses the same operation for painted and legacy lit materials.
export function setSurfaceEmission(material,color,power){
  const native=material.userData.nativeEmission;
  if(native){native.color.set(color);native.power.value=power;}
  else if(material.emissive){material.emissive.set(color);material.emissiveIntensity=power;}
}
