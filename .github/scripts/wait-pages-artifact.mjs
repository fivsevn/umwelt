// The artifact upload service may finalize before the REST listing catches up.
// A distinct attempt name also keeps a retry from matching an older upload.
const { GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_TOKEN, PAGES_ARTIFACT_NAME } = process.env;
if (![GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_TOKEN, PAGES_ARTIFACT_NAME].every(Boolean))
  throw new Error("Missing Pages artifact visibility configuration");
const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}/artifacts?per_page=100`;
let visible = false;
for (let attempt = 0; attempt < 15; attempt++) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Pages artifact listing returned HTTP ${response.status}`);
  const artifacts = (await response.json()).artifacts || [];
  const matches = artifacts.filter(a => a.name === PAGES_ARTIFACT_NAME && !a.expired);
  if (matches.length === 1) { visible = true; console.log("Pages artifact is visible for deployment"); break; }
  if (matches.length > 1) throw new Error("Duplicate Pages artifact for this attempt");
  await new Promise(resolve => setTimeout(resolve, 2000));
}
if (!visible) throw new Error("Pages artifact did not become visible within 30 seconds");
