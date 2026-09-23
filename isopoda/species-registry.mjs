import {RAW_SPECIES} from './data/species/manifest.mjs';
import {applySpeciesDisplayScale} from './species-size.mjs';
import {applyLocomotionProfile} from './locomotion.mjs';

// Keep the original 13-species table stable. The data manifest owns append order for
// accepted taxa, hobby lineages, reference specimens and aquatic taxa so expansion
// adds one registration point without rewriting save-compatible definitions.
// Display size is layered on here, after morphology: body proportions remain anatomy/render data,
// while adult body-length references only scale the complete specimen silhouette.
// Scientifically useful reference taxa can live in the registry without being eligible for
// the terrestrial habitat draw; collection.mjs respects game.habitatEligible === false.
export const SPECIES=RAW_SPECIES.map(applySpeciesDisplayScale).map(applyLocomotionProfile);
export const speciesById=id=>SPECIES.find(s=>s.id===id)||SPECIES[0];
