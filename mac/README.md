# UMWELT for macOS

Local offline desktop edition: homepage, TICK and ISOPODA. Build on macOS with
`node mac/build.mjs /path/to/output`. The builder downloads the pinned Electron
runtime, checks its published SHA-256 checksum, bundles the public site, ad-hoc
signs the application, and creates a zip for the current CPU architecture.
The mac directory is excluded from the website artifact.

Double-click UMWELT.app. The initial content area is phone-sized (390 × 760), and the window can be resized. Its pixel title bar and bevel are the actual frameless app window: drag the title to move it; use the pixel buttons to minimize, maximize/restore, or quit. The small square returns to the homepage. Move it to Applications if desired. All runtime game
resources are bundled; external author/reference links open in the browser.
Closing the window, Command-Q, or the homepage's End observation quits the app.

Saves use a stable `umwelt://game` origin and
`~/Library/Application Support/com.fivsevn.umwelt`. Collection, observations,
language, and last catalog specimen survive relaunches and replacing the app.
The app menu offers Show saved data. Existing browser saves are separate.

The homepage's lower-left menu includes Uninstall environment. A native confirmation
moves this application to the Trash and keeps saves by default. An unchecked
option also moves saved data to the Trash. Cancel does nothing. Uninstall is
restricted to the packaged UMWELT.app; development runtimes cannot delete themselves.

This local trial is ad-hoc signed, not Developer ID signed or Apple notarized.
Public distribution requires the author's Apple Developer credentials. No
credentials or automatic updater are included.

`UMWELT_TEST_USER_DATA` selects an isolated data directory for desktop QA.

ISOPODA fits the real window to the visible selector, arrival, observation, or ending panel. Window height is capped at the current screen work area. Check for updates compares the application version with the latest stable GitHub Release; it opens the release page on request and does not install automatically. No release, unknown tags and connection failures are shown separately.
