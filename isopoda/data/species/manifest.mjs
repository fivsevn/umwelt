import {SPECIES as BASE_SPECIES} from '../../species.mjs';
import {EXTRA_SPECIES} from './batch-01.mjs';
import {EXTRA_SPECIES_2} from './batch-02.mjs';
import {EXTRA_SPECIES_3} from './batch-03.mjs';
import {EXTRA_SPECIES_4} from './batch-04.mjs';
import {EXTRA_SPECIES_5} from './marine-reference.mjs';
import {EXTRA_SPECIES_6} from './hobby-lines.mjs';
import {AQUATIC_SPECIES} from './aquatic.mjs';

// Single append-order manifest for runtime specimen data.
// Group IDs are developer-facing only; saved identity remains each specimen's stable id.
export const SPECIES_GROUPS=Object.freeze([
 {id:'legacy-terrestrial',rows:BASE_SPECIES},
 {id:'accepted-01',rows:EXTRA_SPECIES},
 {id:'accepted-02',rows:EXTRA_SPECIES_2},
 {id:'accepted-03',rows:EXTRA_SPECIES_3},
 {id:'accepted-04',rows:EXTRA_SPECIES_4},
 {id:'marine-reference',rows:EXTRA_SPECIES_5},
 {id:'hobby-lines',rows:EXTRA_SPECIES_6},
 {id:'aquatic',rows:AQUATIC_SPECIES}
]);
export const RAW_SPECIES=SPECIES_GROUPS.flatMap(group=>group.rows);
