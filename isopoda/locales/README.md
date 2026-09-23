# ISOPODA localization

The game currently ships in Chinese (`zh`), English (`en`), Japanese (`ja`) and fictional isopod language (`isopod`). Keep presentation code language-neutral and keep locale data separated by domain.

## Where text lives

- `locales/ui.mjs` — static interface labels and accessibility copy. All languages use the same stable keys.
- `locales/game.mjs` — authored game / encounter translations. Chinese remains the canonical simulation text so saved runs stay language-neutral; every active Chinese source string must have English and Japanese rows. Isopod text is generated at display time by `locales/isopod.mjs` so new story copy inherits the fictional language automatically.
- `locales/annotations.mjs` — specimen annotation translations, keyed by stable specimen id. Isopod annotations are compressed from canonical Chinese annotation copy.
- `credits.md`, `credits.en.md`, `credits.ja.md`, `credits.isopod.md` — localized Credits prose. Their links and section structure must stay aligned.
- Species common names remain in species data because they are biological / trade metadata, not literal UI translations. Do not invent Japanese or English common names when a stable local name is not documented; fall back to trade name or scientific name according to `i18n.mjs`.

## Maintenance rule

Do not add a visible Chinese string and assume the other languages will inherit it. After any copy, specimen, Credits or locale change, run:

```sh
node isopoda/tools/check-i18n.mjs
```

The check verifies:

- identical UI key sets for every entry in `SUPPORTED_LANGUAGES`;
- English and Japanese annotation entries for every registered specimen;
- active encounter / game copy is represented in the locale table;
- Credits links and section counts stay synchronized.

The same check runs in GitHub Actions. A missing language should therefore be caught before it becomes a silent mixed-language screen.

## Adding another language

1. Add the language code to `SUPPORTED_LANGUAGES` in `locales/ui.mjs` and add the complete UI key set.
2. Extend `locales/game.mjs` and `locales/annotations.mjs` with that language. The special `isopod` locale is generated instead of authored row-by-row.
3. Add the localized Credits document.
4. Add the language-specific font rules only if needed.
5. Extend `tools/check-i18n.mjs` so the new language is required by the audit.

Keep stable ids / keys unchanged when wording changes. Translation identity must not depend on the current Chinese sentence text for new code.

For all new narrative pools and the explicit clean-baseline exceptions, see `../docs/narrative-contract.md`. Run both the i18n checker and narrative validator; do not silence missing translations with broad ignore rules.
