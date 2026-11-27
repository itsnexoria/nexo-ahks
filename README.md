# Nexo Ahks

Block-based **AutoHotkey v2** script builder for Windows (Electron). Snap blocks together, try the script in a built-in simulator, run it, or compile it to an `.exe`. Import an existing `.ahk` (v1 or v2) and it becomes blocks.

## Use it
Download the installer or portable exe from the [Releases](../../releases) page. Installed copies update themselves.

Run / Compile need AutoHotkey v2. The app finds it by itself; if it can't, open **Help → Program locations** to pick it or let the app **download** it (official zip, checked, kept inside the app's folder).

## Run from source
    npm install
    npm start

## Build the Windows EXE
- On Windows: `npm run dist` → installer + portable exe + `latest.yml` in `dist/`.
- No Windows? Push a `v*` tag (matching `version` in `package.json`) and the **Build Windows EXE** workflow builds and attaches everything to the release.

## Tips
- 🎯 next to x/y fields: move the mouse over a spot and press F8 to fill in the position (and pixel color). Esc cancels. ⌨ next to key fields: press the key or combo.
- ⏻ disables a block, ▾ collapses containers, ⧉ duplicates. Hover a block to see its AutoHotkey code.
- Shortcuts: Ctrl+F search blocks, Ctrl+K quick launcher, Ctrl+S save, Ctrl+O open, Ctrl+Z / Ctrl+Y undo/redo, F5 run.
- Project files are `.ahkb` and autosave. Import `.ahk` turns a script into blocks; anything it can't map stays as a *Raw line* block, so nothing is lost.

## Develop
`npm test` (renderer bundle check, lint, main/util/simulator/screen/self tests, dry generation of every block) runs anywhere. `npm run ahkcheck -- --exe <path to AutoHotkey64.exe>` asks real AutoHotkey to validate every generated script. See [DEVELOPMENT.md](DEVELOPMENT.md) for the layout, how to add a block and how releases work, and [CHANGELOG.md](CHANGELOG.md) for history.
