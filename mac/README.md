# UMWELT for macOS

The desktop wrapper packages the tracked public site through `prepareSite`,
including the homepage and the current TICK, ISOPODA, rooftop and OPHIDIA files.
Native window routing and dedicated QA currently focus on the homepage, TICK,
ISOPODA and its reference windows; packaged files alone do not establish native
QA coverage for the newer games. Build on macOS with
`node mac/build.mjs /path/to/output`. The builder verifies the pinned Electron
archive checksum, bundles the public site, ad-hoc signs the app and creates a
zip for the current CPU architecture. Native support files are excluded from
the published website.

The homepage is a fixed 720 × 540 desktop. Games open as independent windows;
ISOPODA uses the authored webpage panels and fits their heights. Its arrival
panel has no added title bar. The archive/journal opens as an independent
window, shares saved records and can remain open after the observation closes.
New windows finish layout before showing and are centered on the screen.
Windows cannot be resized by dragging; the authored fullscreen button switches
between fullscreen and the recommended small size. Command-Control-F also
works through the View menu. Closing a child closes only that window;
Command-Q or End observation quits the whole application.

Saves use the stable `umwelt://game` origin and
`~/Library/Application Support/com.fivsevn.umwelt`. Replacing the application
preserves collection, observations, language and the last catalog specimen.
Existing browser saves are separate. App logs and crash reports also live
inside the private profile.

Only the native homepage renames Leave environment to Uninstall environment.
The original webpage-styled confirmation is the final confirmation. Confirming
uninstall permanently removes the packaged UMWELT.app and its entire private
profile, including all collection, observation, settings and cache data. Cancel
changes nothing. Development runtimes cannot uninstall themselves.

Check for updates compares the app version with the latest stable GitHub
Release and offers its release page. It does not install automatically. Missing
releases, unknown version tags and connection failures are reported separately.

This local trial is ad-hoc signed, not Developer ID signed or Apple notarized.
Public distribution needs the author's Apple Developer credentials.
`UMWELT_TEST_USER_DATA` provides an isolated profile for desktop QA.

Visual parity: web panels and native title controls import `window-controls.css`.
Keep bevel colors, shadow and pressed offset shared. Native-only CSS is for window
layout/drag regions and platform behavior, not an alternate visual theme.
Verify with `mac/qa-chrome.cjs` against the local web server on port 8767.

## Version and release records

`mac/package.json` is the local build version (currently 0.1.5).
[RELEASE-NOTES.md](RELEASE-NOTES.md) preserves the earlier 0.1.3 rehearsal, not the
current release status. The root [download section](../README.md#下载与版本更新)
links to published packages; a newer website commit does not update an existing
desktop download. Verify the actual package and native QA before a new release.
Shared website publication rules live in [deployment](../docs/deployment.md).

## Windows preview

The same desktop runtime is packaged by `mac/windows/build.mjs` on Windows.
`mac/windows/package.json` pins the build/test tools. The Windows Actions workflow
runs the shared native-window suite, offline languages and full TICK loop, then
launches the actual portable EXE from a spaced/non-ASCII path, verifies saved
records across a restart and confirms complete uninstall on a disposable copy.
Only after all checks pass does it attach the ZIP to the existing v0.1.5 preview.
The ZIP has exactly UMWELT.exe and README.txt. Runtime files extract temporarily;
persistent saves live in %APPDATA%/com.fivsevn.umwelt. The portable EXE is unsigned.
