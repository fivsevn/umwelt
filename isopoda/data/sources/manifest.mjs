import {sources as BASE_SOURCES,evidence,sourceDirectory,frameworkSources} from '../../sources.mjs';
import {EXTRA_SOURCES_5} from './marine-reference.mjs';
import {EXTRA_SOURCES_6} from './hobby-lines.mjs';
import {AQUATIC_SOURCES} from '../species/aquatic.mjs';
import {AQUATIC_EXPANSION_SOURCES} from './aquatic-expansion.mjs';
import {RELEASE_AQUATIC_SOURCES} from './release-aquatic.mjs';

// Single append-order manifest for evidence/source rows.
// Group IDs are organizational only and never become public or saved identifiers.
export const SOURCE_GROUPS=Object.freeze([
 {id:'legacy',rows:BASE_SOURCES},
 {id:'marine-reference',rows:EXTRA_SOURCES_5},
 {id:'hobby-lines',rows:EXTRA_SOURCES_6},
 {id:'aquatic',rows:AQUATIC_SOURCES},
 {id:'aquatic-expansion',rows:AQUATIC_EXPANSION_SOURCES},
 {id:'release-aquatic',rows:RELEASE_AQUATIC_SOURCES}
]);
export const RAW_SOURCES=SOURCE_GROUPS.flatMap(group=>group.rows);
export {evidence,sourceDirectory,frameworkSources};
