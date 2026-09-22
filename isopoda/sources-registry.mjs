import {AQUATIC_SOURCES} from './data/species/aquatic.mjs';
import {sources as BASE_SOURCES,evidence,sourceDirectory,frameworkSources} from './sources.mjs?v=species-33';
import {EXTRA_SOURCES_5} from './data/sources/marine-reference.mjs?v=species-34';
import {EXTRA_SOURCES_6} from './data/sources/hobby-lines.mjs?v=wiki-1';

export const sources=[...BASE_SOURCES,...EXTRA_SOURCES_5,...EXTRA_SOURCES_6,...AQUATIC_SOURCES];
export {evidence,sourceDirectory,frameworkSources};
export const sourcesFor=species=>sources.filter(s=>species.evidenceIds?.includes(s.id));
