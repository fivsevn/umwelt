# Shared audio mixer

`assets/audio/audio-engine.mjs` exports `createAudioEngine`, `DEFAULTS` and `AUDIO_KEY`.
The isopoda integration lives in `isopoda/audio-ui.mjs` and `isopoda/audio.css`;
existing toolbar buttons keep their positions. The music channel currently carries
soft filtered noise ambience, not a composed BGM. All audio is generated locally.

Settings persist under localStorage key `umwelt-audio-v1` as
`{master:{volume,muted},music:{volume,muted},sfx:{volume,muted}}`.
Volumes range from 0 to 1. Invalid storage or blocked storage falls back safely.
Defaults are master 0.8, music 0.3, sfx 0.45, all unmuted. Change `DEFAULTS` for
new users; existing saved preferences remain authoritative. Remove that key to
reset preferences. Muting preserves the slider value; zero volume also silences.

Call `unlock()` from a trusted user gesture. It creates one context and returns
whether resume succeeded; unsupported audio does not block the game. The page
retries on subsequent gestures, suspends in the background and resumes when
visible. Use `set('master',{volume:0.5,muted:false})` for a future global control;
`set('music',...)` and `set('sfx',...)` remain independent. Use `subscribe(fn)` for
UI updates and `getSettings()` for a copy. Reuse one engine per page.

Tune `ambience()` for noise amplitude, 90 Hz high-pass / 650 Hz low-pass and
1.2-second fade-in. Tune `play()` for a low-pass noise key impact (0.48 gain), quieter return
22 ms later (0.2 gain), and a 25 ms triangle body (0.16 peak gain). Three gestures are click, confirm and back; the
page delegates button/link clicks to avoid duplicate effects from gameplay.
Gain changes are smoothed; finished UI nodes disconnect. No external files,
CDN dependencies or absolute asset URLs are used.

Verification: `node isopoda/tools/check-all.mjs`; serve repository root on port
8878 and run `node tests/browser/audio-controls.cjs` with Playwright installed.
`BASE_URL`, `CHROME_PATH`, and `WEBKIT_PATH` can override test host/browser paths.
The browser check covers gesture unlocking, independent preferences, reload,
menu dismissal, keyboard focus, localization, mobile fit and resume.
Automated checks do not substitute for listening on the target speakers.
