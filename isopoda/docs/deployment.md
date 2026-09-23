# Static deployment and asset identity

Source HTML, CSS and module URLs are unversioned. Do not add manual `?v=` counters. The Pages workflow copies the existing public surface to `_site`, subsets the font, then runs `.github/scripts/stamp-assets.mjs _site "$GITHUB_SHA"` before uploading the artifact.

The transform adds the same full commit SHA to existing local assets in HTML, JS module imports/static filenames and CSS URLs. Relative paths, query parameters other than `v`, fragments, navigation routes and remote/data URLs are preserved. Every imported module in the artifact receives the same version so module identity is consistent. Credits' existing filename table is stamped, covering the dynamic fetch without changing its path or text. Missing explicit relative assets fail the build. Never run stamping over the checkout: `_site` is disposable output.

The stamp is deterministic/idempotent and uses no runtime bundler, redirects or public-path renames. It also versions fonts after subsetting. A rollback builds the earlier commit's artifact and thus uses that commit's query identity. Already open tabs retain their loaded module graph until navigation/reload, as before; no service worker or save migration is introduced.

Run the Node asset-stamping tests and build an artifact using the Pages exclusions. Serve both source and stamped output for browser checks. The main-game browser harness supports baseline comparison via `COMPARE_URL`, including home, game, morphology and habitat routes; morphology's existing ten-viewport suite remains independent. Main-game CSS files stay separate and unchanged.
