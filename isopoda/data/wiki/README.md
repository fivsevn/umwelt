# Specimen wiki source policy

The Morphology Lab is the public research layer for individual isopod specimens. It is intended to work as a compact, traceable wiki without turning the main game UI into a bibliography.

## Include

A source can appear in a specimen reference module when it materially supported the project and belongs to one of these classes:

1. **A1 — primary / authoritative**
   - taxonomic databases and catalogues (WoRMS, GBIF, ITIS, Catalogue of Life);
   - original descriptions, revisions, peer-reviewed morphology, ecology or behaviour papers;
   - museum / institutional publications.

2. **A2/B1 — specialist reference**
   - specialist society species accounts;
   - non-commercial identification databases and photo repositories;
   - specialist academy pages that clearly distinguish trade names from formal taxonomy.

3. **B2 — hobby / personal documentation**
   - personal keeper blogs, long-running photo galleries or culture notes;
   - used only for trade-name history, captive-line observations, photographs or community nomenclature;
   - never promoted into formal species-level evidence without independent support.

## Exclude from the public wiki

- shop product pages;
- marketplace/search-result pages;
- price/listing pages;
- affiliate pages whose primary purpose is selling animals;
- untraceable reposts or image mirrors.

A commercial page may have been encountered during research, but it must not become a public evidence citation. If a trade claim is only available from sellers, the project should mark the claim as unresolved / hobby-reported and look for a non-commerce replacement.

## Evidence separation

A specimen page may merge several source registries:

- project taxonomy / morphology / ecology evidence;
- renderer framework literature;
- locomotion research;
- non-commerce photo / trade-name / keeper references.

The source type and confidence level should remain visible. A hobby photograph can support appearance or trade-name use; it does not establish taxonomy. A laboratory locomotion paper can support a movement claim; it does not automatically define the exact normalized animation coefficient.

## Maintenance rule

When a new specimen is added:

1. attach at least one specimen-level source;
2. add authoritative taxonomy when the taxon is formally described;
3. add the actual papers used for morphology, ecology or behaviour;
4. add non-commercial image/reference sources when they materially informed the renderer or trade-name identification;
5. keep uncertain trade assignments explicitly uncertain;
6. run the morphology-reference tests so unmapped specimens and commerce URLs fail CI.
