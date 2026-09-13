# Desktop release

The website opens as a pixel desktop with an Isopoda application icon. Launch,
arrival, observation, catalog, logs and endings share the window chrome.

Habitat actors are composited into the environment's two-world-unit grid before
camera scaling. Their coarse, slimmer projection samples the anatomical model;
the catalog retains the detailed adult standard pose and a specimen pin. Actor
rotation, lift and position all land on the shared scene grid. Future habitat
content must use that grid rather than independently scaled DOM sprites.

New runs store the local calendar start date. Catalog collection dates persist
per species at the first dated encounter. Legacy undated specimens stay undated.
Game days advance from the start date while existing observation times and save
format compatibility remain intact.

Validation: 28 node tests including shared actor grid and date persistence;
browser checks at 320x640, 390x844, 844x390 and 1440x900 cover desktop navigation,
launch, acquisition date, catalog standard pose, progression and reload. Window
minimize/restore, fullscreen/restore and close/save/resume were also exercised.
