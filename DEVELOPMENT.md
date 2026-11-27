# Development notes

## Layout
| Path | What it is |
|---|---|
| `main.js` | Electron main process: window, tray, IPC handlers (`handle(...)`), running/compiling scripts, config, updates, program locations. Errors are returned as values, never thrown to the page. |
| `preload.js` | The only bridge: exposes `window.api` (`contextIsolation`, `sandbox`). Every new IPC needs a line here **and** a handler in `main.js`; `scripts/maintest.js` lists the ones that must exist. |
| `compile-util.js`, `update-util.js`, `ahk-runtime-util.js`, `crash-util.js`, `screen-util.js` | Pure helpers (no Electron) so they can be unit-tested anywhere (`scripts/utiltest.js`, `screentest.js`). |
| `renderer/index.html`, `renderer/style…` | The page. No inline scripts (CSP). |
| `renderer/src/*.js` | The editor, one file per area, **in load order**. Edit these. |
| `renderer/app.js` | **Generated** from `src/` by `npm run build:renderer`. Commit it; `npm test` fails if it is stale. |
| `renderer/sim.js` | "Try it" simulator (also unit-tested in plain Node by `simtest.js`). |
| `scripts/` | Tests and tools (see below). |

The files in `renderer/src/` share one global scope on purpose (functions in one call functions in another, and top-level code runs in order), which is why they are joined into one script instead of loaded separately.

## Adding a block
Add an entry to `T` in `renderer/src/01-core.js` (`c` category, `g` palette group, `t` label with `{field}` slots, `f` field defaults, `gen` code generator, `box:1` for containers). If the code it makes should come back as the same block when imported, add the matching rule in the importer (same file, `parseAhk`). `selftest` checks every block: clean code, export → import → export round trip, imported as a real block (not a raw line). Add a template in `02-palette.js` (`TPL`) if it deserves one. Then `npm run build:renderer`.

## Tests
| Command | Needs | Checks |
|---|---|---|
| `npm test` | Node only | bundle fresh, lint, main.js loads with a fake Electron + IPC lockdown + config recovery, helpers, simulator, screen tools, every block/template/importer/editor interaction, dry generation of 340+ scripts |
| `npm run ahkcheck -- --exe <AutoHotkey64.exe>` | Windows + AHK v2 | every generated script is accepted by real AutoHotkey (`/validate`, or an ExitApp-first fallback) |
| `npm run uitest` / `npm run e2e` | Electron (CI runs them on Windows) | layout in real Chromium; the real app through the real preload/IPC bridge |

CI: `ci.yml` (every push/PR: Linux tests + Windows ahkcheck/uitest/e2e), `build.yml` (tags `v*`: all of that, then installer, portable exe, blockmaps, `latest.yml`, SHA-256 sums attached to the release).

## Releasing
1. Bump `version` in `package.json`, add a section to `CHANGELOG.md`.
2. `git tag vX.Y.Z && git push --tags`. The tag must equal `v<package.json version>` (the workflow checks it, and the updater compares them).
3. Installed copies see `latest.yml` and offer **Update now**; portable copies get a link to the release.

## Security model
- Page: sandboxed, context-isolated, CSP `script-src 'self'`, no permissions, no navigation, no new windows. It only gets `window.api`.
- Main: every handler checks the caller is the app's `file://` page; file access from the page is limited to absolute `.ahk`/`.ahkb` paths; external links only to `https://github.com/`; downloads only from GitHub hosts, size-capped and SHA-256-checked when GitHub supplies a digest; temp files in a private folder that is removed on exit.
- Anything user-controlled that goes into `innerHTML` must go through `esc()`; prefer `textContent`.

## Known gaps / ideas
- The UI Designer models **one** window. Extra `Gui()` windows in an imported script are kept as ordinary code blocks (nothing is lost), but they are not editable in the designer.
- v1 `Goto` has no v2 equivalent and is left as a raw line. `Loop Read in, out` (two files) is left raw.
- Code signing: builds are unsigned, so Windows SmartScreen warns on first run. Signing needs a certificate; electron-builder reads `CSC_LINK`/`CSC_KEY_PASSWORD` if you add them as repository secrets.
- The AutoHotkey zip from GitHub may not include the compiler; Compile to EXE then still needs `Ahk2Exe.exe` from the full installer (the app tells the user).
- Not planned: a rich text box (AutoHotkey v2 has no native one).
