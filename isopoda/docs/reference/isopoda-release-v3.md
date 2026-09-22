# Observation edition

- 13 independently selectable visual profiles; 12 CSS individuals per enclosure.
- 7 days × 3 periods = 21 choices per run, each followed by an explicit result before advancing.
- 42 morning/evening base passages, 39 species observation passages, 8 conditional environment passages. Seven care actions have three result variants each. Seven noon interactions rotate once per run, in a seeded order.
- Count visible individuals in a static observation strip; choose a watering area; predict a route; place a leaf; wait for emergence; select an observation point; record a possible molt.
- Six non-ranked endings chosen by the run's accumulated actions. Completed endings remain in a local paginated archive. Per-run journal preserves every response.
- Enclosure top left separates device-local real time from simulated temperature, RH, ventilation and light. Game time advances only by explicit choices. Closing a tab does not advance the simulation.
- State is saved after every choice. Version-1 saves migrate the day to the morning of that day; past v1 actions are not fabricated as new journal entries. v1 keys remain untouched.
- CSS-drawn animals; no reference stamp assets or other raster downloads added. Locally served pixel font retained.

## Checks

`node --test tests/isopoda.test.mjs`

Tests cover all profiles, all offered actions across seeded runs, duplicate-click guards, JSON round-trip saves, invalid state, legacy migration and actual legal paths reaching all six endings. Browser verification covers a 21-turn run with mid-run reload, selector entries, archive, mobile layouts and visual skins.
