# Isopoda morphology renderer

This file documents the scientific scope of the 64 px dorsal-view isopod renderer.
It is a renderer contract, not a taxonomic revision and not a morphometric dataset.

## What is now split

The renderer can vary the following external characters independently:

- overall body length / width / convexity
- cephalon width and outline
- Porcellio-style frontal median/lateral lobes
- frontal shield / scutellum proxies in compact roller taxa
- compound-eye placement at pixel scale
- antenna II length, spread, bend, thickness and visible segment proportions
- special antenna-peduncle projections where useful (P. spatulatus / P. bolivari)
- seven pereon tergites and their overlap / arc
- epimera width, lobe outline, skirt and posterior projection
- dorsal surface relief / tuberculation / scale-seta texture proxy
- noduli laterales proxy where genus-level literature makes it useful
- seven pereopod pairs: exposure, reach and gait amplitude
- pleon length / width / taper
- pleotelson length, width, outline, apex and keel proxy
- uropod projection, position, thickness and compact/flush/projecting arrangement
- full / partial / absent conglobation rendering strategy
- molt-region semantics (anterior vs posterior biphasic molt)

## Evidence levels

`species-character`
: A published diagnostic character for the named accepted species/reference taxon.

`genus-character` / `genus-proxy`
: Based on a published genus diagnosis. It is appropriate for the silhouette but does not prove that a hobby trade animal has been correctly assigned to that genus.

`family-proxy`
: Conservative family-level visual grammar used when species/genus identification is unresolved.

`trade-visual-proxy` / rendering proxy
: Appearance used to keep the game visually coherent. It must not be presented as a formal taxonomic character.

## Current mapping

| id | display taxon / trade label | morphology group | scientific handling |
|---|---|---|---|
| dairy | Porcellio cf. laevis “Dairy Cow” | `porcellioStandard` | Porcellio genus proxy; trade lineage identity unresolved |
| echinatus | Porcellio echinatus | `porcellioEchinatus` | accepted species; rough surface receives species-level emphasis |
| coros | Porcellio spatulatus “Coros” | `porcellioSpatulatus` | accepted reference species; broad epimera and large antennal article-3 tooth emphasized |
| bolivari | Porcellio bolivari | `porcellioBolivari` | accepted species; long antenna, article-3 tooth and projecting posterior emphasized |
| diablo | Ardentiella sp. “Red Diablo” | `ardentiellaRunner` | genus-level proxy only; hobby taxon unresolved |
| ember | Ardentiella sp. “Ember Bee” | `ardentiellaRunner` | genus-level proxy only; hobby taxon unresolved |
| cappuccino | “Cubaris” sp. “Cappuccino” | `armadillidHobby` | compact roller family-style proxy; identity unresolved |
| pink | “Cubaris” sp. “Pink Laser” | `armadillidHobby` | compact roller family-style proxy; identity unresolved |
| ducky | “Cubaris” sp. “Rubber Ducky” | `armadillidHobby` | Armadillidae-style proxy; species unresolved |
| amber | “Cubaris” sp. “Amber Ducky” | `armadillidHobby` | compact roller family-style proxy; identity unresolved |
| vex | Troglodillo sp. “Vex” | `armadillidHobby` | visual compact-roller proxy only; no species-level claim |
| daxin | Venezillo sp. “Daxin Tricolor” | `venezilloCompact` | genus proxy; hobby species unresolved |
| orange | Armadillidium frontetriangulum “Orange” | `armadillidiumCompact` | accepted reference species + artificial colour morph |

## Deliberately not rendered

These are real taxonomic characters, but drawing them in the current dorsal 64 px sprite would imply precision the image cannot support:

- antennulae / antenna I and aesthetasc counts
- mouthpart characters (mandible, maxillula, maxilla, maxilliped)
- pleopod lung structure
- genital papilla
- male pleopod I/II diagnostic structures
- sex-specific pereopod brushes, pits and fine podomere characters
- microscopic scale-seta shape
- tergal pore / gland-field microstructure
- detailed ventral lobes, schisma and locking structures used in some conglobating groups
- exact ommatidia counts

These belong in a future enlarged specimen/anatomy view, not in the habitat sprite.

## Important renderer rule

Never infer a new hobby species' detailed morphology solely from its trade name or colour pattern.
For an unresolved trade taxon, use the narrowest supported genus/family template and mark the confidence as a proxy. A species-specific template should only be added when a reliable diagnostic source or a verified specimen identification supports it.

## Framework references

- External Oniscidea anatomy / identification framework: https://pmc.ncbi.nlm.nih.gov/articles/PMC6288251/
- Armadillidium / Venezillo identification characters: https://pmc.ncbi.nlm.nih.gov/articles/PMC4525033/
- Ardentiella / Merulanella reassessment (2025): https://doi.org/10.3897/nhcm.2.144386
- Porcellio spatulatus comparison: https://www.entomologica.es/publicaciones-boletin/art1818
- Porcellio scale-setae and diagnostic morphology: https://www.entomologica.es/publicaciones-boletin/en/vol72
- Biphasic molt framework: https://pmc.ncbi.nlm.nih.gov/articles/PMC3335403/
