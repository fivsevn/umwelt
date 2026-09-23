# ISOPODA documentation

This is the single documentation entry point for ISOPODA development.

## Current development contracts

- `../README.md` — runtime boundaries, public-surface contract and stability rules.
- `content-map.md` — where active authored game content belongs.
- `cohort.md` — habitat-aware cohort model (seven by default, one for abyssal).
- `species-data-contract.md` — current registry/schema and specimen extension rules.
- `save-compat.md` — stable storage, archive and content IDs.
- `narrative-contract.md` — stable text keys, locale coverage and extension validation.
- `deployment.md` — generated asset versions and public-output checks.
- `morphology-renderer.md` — current morphology renderer scope and evidence handling.

These files should be checked before adding new gameplay, narrative, species, localization or renderer content.

## Reference archive

`reference/` contains earlier implementation notes, release notes, system studies and scientific/data specifications that are still useful for context.

The `*-2026-09-13.md` species and renderer specifications preserve the original 13-entry baseline; they are historical, not live specifications. `morphology-layout-repair.md` records a completed repair. Do not update these snapshots to describe new runtime changes.

Important: files in `reference/` are not automatically current runtime contracts. Versioned notes such as `*-v3.md`, `*-v4.md` or `*-v6.md` describe the state of the project when they were written. When a reference note conflicts with current code or the current development contracts above, the current code and current contracts take precedence.

The archive currently includes material about:

- aquatic habitats and environment memory
- specimen naming and data standards
- morphology and projection studies
- scenery and interaction systems
- historical release / field-note iterations
- renderer specifications
- reaction bubbles and other focused subsystem notes

## Documentation rule

New active maintenance documentation belongs under `isopoda/docs/`.

Do not recreate a second ISOPODA documentation root at repository-level `docs/`. If a note is historical or narrowly technical, place it under `isopoda/docs/reference/`.
