# Reference placement — project-wide rule

Read `docs/laboratories.md` before adding or moving scientific references.

- The game Credits lists umbrella database, publisher, journal or institution homepages only. Do not append paper citations, species detail links, habitat explanations, scientific paragraphs or per-feature bibliographies anywhere in `credits*.md`.
- Species-specific papers and links belong to that specimen's **当前标本参考** at `/isopoda/morphology/`. Use the shared source registry and the specimen's evidence IDs; retain claim-to-source correspondence.
- Habitat/background papers and links belong to **当前环境参考** at `/isopoda/habitat`, mapped by environment in `data/habitats/references.mjs`. State the supported feature and distinguish authored game parameters from evidence.
- A paper relevant to both a species and an environment may be linked from both, using one shared source entry with distinct support notes. Do not duplicate records or put the detail back into Credits.
- These sister laboratories carry the scientific background. The game carries narrative grounded in that evidence. Keep Asimov's notebook prose separate from the scientific species record.
- Run `tools/check-all.mjs` from the repository root via `node isopoda/tools/check-all.mjs`, plus the affected laboratory browser checks. The Credits guard must cover the entire document, not only its primary-source section.
