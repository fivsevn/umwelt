# Narrative and localization extension contract

New authored content uses stable text keys with complete zh/en/ja data; isopod text is generated from canonical Chinese. Keys represent identity, never visible prose. Recommended shape: `<pool>:<node-id>:<field>` and `<pool>:<node-id>:option:<option-id>:<field>`. Never derive new keys from translated strings or array position. Preserve stable habitat, species, ending and option references separately from localized labels.

Existing content remains unchanged:

- Terrestrial Chinese-string lookup and dynamic composition live in `locales/game.mjs`. These are compatibility paths; do not add another raw-string mapping model for new narrative pools.
- Ordinary aquatic rows remain `[observation, action, delta, consequence]`, with authored zh/en/ja triples and existing index-based keys. Alternates retain their `when` conditions and indexed slots.
- Abyssal keeps 15 ordered nodes, immutable option IDs, existing triples, option presentation order, fragment unlock/resonance rules and ending composition. Do not migrate these into another representation as cleanup.
- Engine midday prose is still active and deliberately retained to avoid changing assembly. New prose belongs in content/data modules; moving existing prose requires a separate behavior-equivalence review.

For a new pool, expose `TEXT_CATALOG` from a module under `data/narrative/`. Each row has `{key, locales:{zh,en,ja}, refs?:{habitat:[],species:[],ending:[]}}`. The validator discovers these modules automatically. The runtime adapter for a future pool must consume those keys; do not copy the same text into another runtime table. No new pool is enabled by this cleanup. Existing triples are validated directly without rewriting them or duplicating their text into the catalog.

`tools/validate-narrative.mjs` validates keys, duplicate nodes/options, all base/alternate triples, allowed alternate conditions, the full abyssal sequence, fragments/endings, locale resolution and current habitat/ending references. `validateTextCatalog` checks future keys and registry references. `tests/data-contracts.test.mjs` includes deliberately corrupt inputs so checks cannot pass merely by importing the data. New branch conditions need reachable-state tests in addition to structural validation.

## Clean i18n baseline

The old scanner omitted aquatic species: annotation membership now uses the shared registry. Six direct interaction-memory strings are already translated by the real `gameText` dynamic handler. Three exact sentence fragments are checked via complete translated samples. Internal PERIODS labels remain explicitly excluded. The unused MORNING pool and its 18 inactive warnings were removed.

Every specimen, including `giganteus`, requires authored English and Japanese Asimov notes. Missing locale entries and empty translated lines fail the check. The checker now covers 27 ordinary aquatic turns plus 15 abyssal nodes, including alternate and ending data. Chinese/Japanese strings may legitimately be identical when an authored locale row exists.

Run `node isopoda/tools/check-i18n.mjs`, `node isopoda/tools/validate-narrative.mjs` and all Node tests before committing authored content.
