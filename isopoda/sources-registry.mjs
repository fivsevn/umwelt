import {sources as BASE_SOURCES,evidence,sourceDirectory,frameworkSources} from './sources.mjs?v=species-33';
import {EXTRA_SOURCES_5} from './sources-extra-5.mjs?v=species-34';
import {EXTRA_SOURCES_6} from './sources-extra-6.mjs?v=species-39';

export const sources=[...BASE_SOURCES,...EXTRA_SOURCES_5,...EXTRA_SOURCES_6];
export {evidence,sourceDirectory,frameworkSources};
export const sourcesFor=species=>sources.filter(s=>species.evidenceIds?.includes(s.id));
