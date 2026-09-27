# 0.1.3 local preview — not published

- Keep the archive open while observing: newly collected specimens update in place.
- Detached archive windows cannot overwrite observation saves; background save updates preserve reading position.
- Notebook windows fit their content and follow new entries when reading the latest page.
- Reopening a reference focuses the existing window. Observation and references close independently.
- Web homepage menu contains only Leave environment; desktop retains quit, uninstall and updates.
- Desktop button focus outlines are hidden; authored website styling is unchanged.

## Offline rehearsal

Run `node mac/release-dry-run.mjs /path/to/build` after building.
This verifies signing and archive contents and writes SHA256SUMS.txt and release-preview.json.
It creates no remote tag, push, draft or release.

After further debugging, use a 0.x version marked GitHub Pre-release, initially saved as a draft.
Before any publication, configure preview-channel update discovery (the current updater deliberately uses latest stable only), repeat install/relaunch/uninstall testing on a disposable profile, and decide signing/notarization for distribution. Publishing remains a separate authorized action.
