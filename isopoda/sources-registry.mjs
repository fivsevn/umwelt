import {RAW_SOURCES,evidence,sourceDirectory,frameworkSources} from './data/sources/manifest.mjs';

export const sources=[...RAW_SOURCES];
export {evidence,sourceDirectory,frameworkSources};
export const sourcesFor=species=>sources.filter(s=>species.evidenceIds?.includes(s.id));
