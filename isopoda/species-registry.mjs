import {AQUATIC_SPECIES} from './data/species/aquatic.mjs';
import {SPECIES as BASE_SPECIES} from './species.mjs';
import {EXTRA_SPECIES} from './data/species/batch-01.mjs';
import {EXTRA_SPECIES_2} from './data/species/batch-02.mjs';
import {EXTRA_SPECIES_3} from './data/species/batch-03.mjs';
import {EXTRA_SPECIES_4} from './data/species/batch-04.mjs';
import {EXTRA_SPECIES_5} from './data/species/marine-reference.mjs';
import {EXTRA_SPECIES_6} from './data/species/hobby-lines.mjs';
import {applySpeciesDisplayScale} from './species-size.mjs';
import {applyLocomotionProfile} from './locomotion.mjs';

// Keep the original 13-species table stable. Independently sourced taxa and explicitly labelled
// hobby lineages are appended in batches so expansion does not rewrite save-compatible definitions.
// Display size is layered on here, after morphology: body proportions remain anatomy/render data,
// while adult body-length references only scale the complete specimen silhouette.
// Scientifically useful reference taxa can live in the registry without being eligible for
// the terrestrial habitat draw; collection.mjs respects game.habitatEligible === false.
const RAW_SPECIES=[...BASE_SPECIES,...EXTRA_SPECIES,...EXTRA_SPECIES_2,...EXTRA_SPECIES_3,...EXTRA_SPECIES_4,...EXTRA_SPECIES_5,...EXTRA_SPECIES_6,...AQUATIC_SPECIES];
export const SPECIES=RAW_SPECIES.map(applySpeciesDisplayScale).map(applyLocomotionProfile);
export const speciesById=id=>SPECIES.find(s=>s.id===id)||SPECIES[0];
