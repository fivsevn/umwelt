# Four observation environments

The opening remains a single retro window. Its arrows change a separate preview state; New Observation draws from that environment and Continue restores the saved habitat. No preview action writes the run save.

## Architecture

- `isopoda/habitats.mjs`: stable habitat IDs, duration, eligible species, default water variables, scene settings, story/ending pools, automatic tidal sequence.
- `engine.mjs`: one shared lifecycle. Terrestrial keeps 7 days / 21 choices; aquatic uses 3 days / 9 choices. `migrateV4` adds `terrestrial` to historical v4 saves while retaining their records, scene, cohort and environment. Existing storage key remains unchanged. v3 and older migration paths remain.
- `data/habitats/stories.mjs`, `aquatic-story.mjs`: 27 distinct observations, 27 contextual interventions, wait/record alternatives, environment feedback and 9 endings. Saves contain stable localization keys. Chinese/English/Japanese authored together; isopod uses the existing encoder.
- `scenery/aquatic.mjs`: deterministic pixel substrate, underwater plants, tide line, particles and light flecks. Reuses stone, leaf, moss and bark renderers and all anatomy rendering. Aquatic locomotion includes crawl/cling/swim/drift and calls the existing direct-interaction recovery function. Reactions and the language-change heart burst remain shared.
- `collection.mjs`: habitat-constrained draws; the original terrestrial pool remains unchanged. Scientific marine references remain excluded.
- `game.js`, `ui.mjs`, `catalog.mjs`, `i18n.mjs`: separate preview/run, habitat title, water instruments, localized observations/endings, source links and render limitations. New content does not depend on MutationObserver translation.

## Species and evidence

Each entry includes taxonomy, habitat, provenance URL, evidence IDs and render limitations. IDs append after the existing 39 entries.

| Habitat | Species | Evidence |
|---|---|---|
| Freshwater | Asellus aquaticus | https://bmig.org.uk/species/asellus-aquaticus |
| Freshwater | Proasellus meridianus | https://bmig.org.uk/species/proasellus-meridianus |
| Freshwater | Proasellus coxalis | https://bmig.org.uk/species/proasellus-coxalis |
| Intertidal | Sphaeroma serratum | https://www.marlin.ac.uk/species/detail/2236 |
| Intertidal | Idotea pelagica | https://www.marlin.ac.uk/species/detail/2104 |
| Intertidal | Idotea granulosa | https://www.marlin.ac.uk/species/detail/2091 |
| Shallow marine | Idotea balthica | https://www.marlin.ac.uk/species/detail/2087 |
| Shallow marine | Idotea emarginata | https://ns-crustacea.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/nsr_taxon.php?epi=210&id=132140 |
| Shallow marine | Idotea neglecta | https://www2.habitas.org.uk/marbiop-ni/species.php?item=S15660 |

Freshwater records support submerged plants, wood, sediments and small watercourses. Intertidal accounts distinguish crevice-dwelling Sphaeroma, exposed-shore I. pelagica and less exposed algal habitat of I. granulosa. The marine bed includes attached and detached algae: I. emarginata particularly uses accumulated detached algae, and I. neglecta is mainly sublittoral among algae. These are ecological selection pools, not an assertion of geographic co-occurrence or safe mixed-species husbandry. Halacarsantia uniramea remains reference-only.

## Limits

Water variables are dimensionless game proxies (including salinity), not measured husbandry guidance. Nine tide states are an authored sequence rather than astronomical predictions. Cling/swim/drift are illustrative behaviors, not hydrodynamics. Family morphology approximates body proportions and tail segmentation; microscopic appendages, sexual diagnostics, tail teeth and serrations are not fully represented. Maximum sizes are documented separately and are not presented as measured typical sizes. Water scenes currently do not implement the full terrestrial ambient molt/collect-shell narrative sequence. Existing terrestrial mechanics remain intact.

## Validation

Run `node --test tests/*.test.mjs`, `node isopoda/tools/check-i18n.mjs` and `node isopoda/tools/check-morphology-page.mjs`.

Browser regression: install Playwright and run `node tests/browser-habitats.cjs` against a local server on port 8765. Optional environment variables: `GAME_URL`, `CHROME_PATH`, `NODE_PATH`. Exercises desktop/mobile, all four languages, all aquatic nine-turn runs, saved-environment continuation, reload and v4 preservation.

Verified before release: 69 Node tests pass; i18n and morphology checks pass. Chromium browser regression completed 24 aquatic runs (3 habitats × 4 languages × 2 viewport sizes), continue/reload, v4 record preservation, live language changes, source links and denied-storage fallback. Inspected mobile preview/play/ending screenshots.
