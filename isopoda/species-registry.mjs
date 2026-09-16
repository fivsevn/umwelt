import {SPECIES as BASE_SPECIES} from './species.mjs?v=base-13';
import {EXTRA_SPECIES} from './species-extra.mjs?v=species-18';
import {EXTRA_SPECIES_2} from './species-extra-2.mjs?v=species-23';

// Keep the original 13-species table stable. Independently sourced taxa are appended in batches
// so future expansion does not rewrite legacy save-compatible species definitions.
export const SPECIES=[...BASE_SPECIES,...EXTRA_SPECIES,...EXTRA_SPECIES_2];
export const speciesById=id=>SPECIES.find(s=>s.id===id)||SPECIES[0];
