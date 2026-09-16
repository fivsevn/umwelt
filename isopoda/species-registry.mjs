import {SPECIES as BASE_SPECIES} from './species.mjs?v=base-13';
import {EXTRA_SPECIES} from './species-extra.mjs?v=species-18';

// Keep the original 13-species table stable. New, independently sourced taxa are appended here
// so future batches can grow without rewriting legacy save-compatible species definitions.
export const SPECIES=[...BASE_SPECIES,...EXTRA_SPECIES];
export const speciesById=id=>SPECIES.find(s=>s.id===id)||SPECIES[0];
