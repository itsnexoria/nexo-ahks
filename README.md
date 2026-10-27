# Nexo Ahks
Block-based AutoHotkey v2 script builder (Electron).

## Run
    npm install
    npm start

## Build the Windows EXE
- On Windows: `npm run dist` -> installer + portable exe in `dist/`
- No Windows? Push to GitHub and run the "Build Windows EXE" action (Actions tab, or push a `v*` tag), then download the artifact.

## Notes
- `npm test` runs a quick self-test (all 226 blocks, importer, templates, key shortcuts).
- Run / Compile need AutoHotkey v2 installed on Windows (autohotkey.com). The app finds it automatically or asks once.
- Project files are `.ahkb`. The current project autosaves.
- 🎯 next to x/y fields: move the mouse over a spot and press F8 to fill in the position (and pixel color for pixel blocks). Esc cancels.
- ⌨ next to key fields: press the key or combo you want.
- ⏻ disables a block (comments it out), ▾ collapses containers, ⧉ duplicates.
- Shortcuts: Ctrl+F search blocks, Ctrl+S save, Ctrl+O open, Ctrl+Z / Ctrl+Y undo/redo, F5 run.
- Import .ahk turns an existing AutoHotkey v2 script into blocks. Anything it can't map becomes a Raw line block, so nothing is lost.
- Hover a block to see the AHK code it makes. The picker works on any monitor.

## v3
- **Tabs**: many scripts at once (double-click a tab to rename). Import .ahk and templates open in a new tab.
- **Code view**: Monaco editor. Edit any script as code, then switch back to Blocks and it converts to blocks (unknown lines stay as Raw line blocks).
- **UI Designer**: drag buttons, text, inputs, checkboxes, dropdowns and sliders to build a window. Buttons can run your Define function blocks.
- **Record**: press Record, do your clicks and typing, press F10. Needs AutoHotkey v2.
- Run `npm install` once so Monaco is downloaded. If Monaco can't load, Code view falls back to a plain text box.

## v3.1
- Importing an .ahk now also imports its `Gui(...)` window into the UI Designer (controls, positions, colors, event handlers). Lines the designer can't edit are kept verbatim, so the regenerated code matches your original.
- A "UI window here" block marks where the window code sits in the script, so globals declared above it still work. Designer-only UIs go at the top.
- Code view edits to the UI section now flow back into the designer.

## v4
- 121 blocks (was 62): try/catch, functions with inputs, wait-until, press/hold N, paste text, relative and gliding mouse, pixel/color search, window move/pin, run hidden, files/ini/download, volume, math, text variables, UI helpers and more.
- Problems panel is much smarter (duplicate hotkeys, bad hotkey spelling, undefined functions, reserved variable names, unbalanced braces) and flagged blocks get a yellow outline.
- Importer handles Allman braces, `} else if`, try/catch, `Send("x")` style calls, trailing comments and keeps raw-line indentation.
- Undo/redo covers the UI Designer. More UI controls (radio, combo, list, progress, group).
- Toggle scripts now work: `#MaxThreadsPerHotkey 2` is on by default (setting in the right panel). Send mode setting added.
- Drop .ahk / .ahkb files on the window, double-click .ahkb files, Ctrl+Shift+S save as, F1 help, window size is remembered.
- 9 new templates, including two with a UI window.

## v4.1 (talking to your UI window)
- "When control {c} event {ev} happens" block: a click/change handler for any control. It is registered for you, no function names to match.
- "When my window event happens" (Close, Escape, Size) block.
- Blocks that take a control now show a dropdown of the controls in your UI Designer. The Problems panel warns if one is missing.
- Read input: "Save Value/Text of control", set text or value, enable/disable, show/hide, focus, add to list, choose item, window title, minimize/maximize.
- Pick a file or folder blocks. UI Designer: duplicate (Ctrl+D), arrow-key nudge, center, bring to front / send to back.
- 3 new UI templates: Name greeter (reads an input), App picker (reads a dropdown), Adder.

## v5
- **Tray menu blocks**: tray menu item (with its own actions), separator, remove standard items, default item, tick/untick/enable/disable items, tray icon, hide/show icon, pop up menu. Scripts with tray items keep running on their own.
- **UI Designer Preview**: switch Design / Preview to see the window with a Windows-style title bar and Windows-style controls, using your real sizes, fonts (size, bold, italic, face), colors, Center/Right/Disabled/Hidden options and window options (-Caption, -MinimizeBox, +ToolWindow...).
- **Per-script settings**: every tab has its own settings (admin, single instance, working folder, hotkey threads, send mode, key/mouse delay, emergency stop, coordinate modes, hidden windows). Importing a script reads these from its header instead of adding its own.
- **Tabs inside windows**: a Tab control with pages. Drag controls onto it, or select it and add controls. Imports `Tab3` + `UseTab` code.

## v6
- **Home**: the app opens on a page with all your scripts as cards. Run / Stop, Edit, pin, duplicate, rename, remove, start with Windows, save as .ahk, show in folder. Search and sort. Scripts can run side by side; the tab bar and card show what is running. **Ctrl+K** opens a quick launcher from anywhere.
- Closing a tab no longer deletes a script. It stays on Home.
- **Add folder**: scan a folder for .ahk files and add them to your library. An unedited imported file runs the original file from its own folder.
- **System tray**: pinned and recent scripts can be run or stopped from the tray icon. Optional: close button hides to the tray, keep scripts running after you quit. (Placeholder tray icon.)
- **Error checking**: wrong placement turns the block red with a plain explanation of why it won't work, the Problems panel lists errors / warnings / tips (click to jump to the block), drag a block over a bad spot and the gap turns red with the reason, Run asks first if a script has errors.
- **33 more blocks** (172 total): Text, Files and System groups (join / replace / split text, copy selected text, copy / move file, make folder, if file exists, lock / sleep / restart, say out loud, screenshot, media keys), plus wait for image then click, click a color, center window, window transparency, If compare, For each in list, Repeat for time, color a UI control and more.
- Scripts and settings are saved in the app data folder (library.json), not browser storage.

## v7
- **Using what people type, made simple.** On any text box in a block there is now a **{}** button. Press it and pick "Text typed in ed1", "Chosen text in dd1", a variable, the clipboard... It is inserted as `{ed1}` and swapped for the real value when the script runs (`Hello {ed1}!`). Boxes that take a value (If, Set variable, Math...) insert `ed1.Value` instead.
- **✨ Make it do something**: select a Button (or any control) in the UI Designer, press it, and a "When control event happens" block is created and shown. Put your actions inside it.
- New **Form** template shows the whole idea end to end. Help (F1) and the UI Designer have a short how-to.
- **UI elements**: 24 kinds to add, including Flat (colored) button, Text area, Password, Number box, Radio, Combo box, List view (with starting rows), Link, Picture, Date picker, Calendar, Hotkey box, Line, Status bar. Edit boxes can have hint text and spinner arrows.
- **Customization** for every element: font, size, bold/italic/underline, text and background colors, alignment, border, disabled, hidden, read-only, password, numbers only, several lines, max length, default button, cursor on open. Windows: background color, default font, size, color, and window options (always on top, resizable, no title bar, tool window, no minimize/maximize).
- **54 more blocks (226 total)**: slow typing, hold-key-while, click N times, wiggle mouse, image-in-area, show desktop, activate-or-run, resize/close windows, rounding/min/max/remainder/random choice, text trim/part/find/repeat, dates and "wait until time", write/read file lines, delete folder, read a web page, volume/mute, recycle bin, monitor off, timers (Every / After), include file, and more UI blocks (set/clear/move controls, tick checkbox, replace list items, list view rows, status bar text, window background).

## v7.1 (bug-fix + easier building)
**Fixes**
- Import: `Click "Left"`, `Click "Left 2"`, `Click "Left down"` and every other command with one quoted argument were dropped to Raw lines. Fixed.
- Import: `CapsLock::Ctrl` (key remaps) turned into a hotkey with a broken body. They are now Remap blocks.
- Import now reads Windows "Unicode" (UTF-16) .ahk files.
- Ctrl+Z / Ctrl+Y / Ctrl+F no longer hijack the Code editor (they used to undo your *blocks* while you typed code).
- Ctrl+S in Code view saved the old blocks and lost typed code. It now applies the code first.
- "For each in list" no longer writes a `global` line inside a loop; function parameters are never declared global.
- Library autosaves when the window loses focus or closes.
- Compile to EXE no longer freezes the app, shows the compiler's real error, and finds Ahk2Exe in more places (or asks once).
- GitHub Action: tag builds no longer fail on publish; tag builds attach the .exe to the release; uses `npm ci`.
- Only one screen-pick / recording at a time. A second launch no longer boots a second window.

**Easier to build**
- **Much better import**: the importer now reverses every block's generator, so about 100 more kinds of lines come back as real blocks instead of Raw lines (wait-until, hold key, window moves, file/sound/volume lines, UI control lines, `Func(a, b) {` and `Func(1)` and more).
- **Click-to-add flows**: click any block to select it. New blocks go inside the selected container or right after the selected block, and the new block becomes selected. So click *When key pressed*, *Click*, *Wait* and they stack in order.
- Search box: press **Enter** to add the first match, **Esc** to clear.
- Keys on the canvas: **Delete** removes, **Ctrl+D** duplicates, **Alt+Up/Down** moves, **Esc** deselects.
- UI Designer: **pink alignment guides** and edge snapping against other controls and the window center/edges (also while resizing), a **Snap** setting (off / 5 / 10 px), hold **Alt** to move freely, and a hint when the window is empty.

## v7.2 (more UI Designer power)
- **Multi-select**: Shift/Ctrl-click controls, drag a box on empty space, or Ctrl+A. Drag moves the whole group; arrow keys nudge it; Delete removes it.
- **Align / distribute / match size** tools appear when 2+ controls are selected (left, center, right, top, middle, bottom, even spacing, same width/height).
- **Ctrl+C / Ctrl+V** on the block canvas copies a block (with everything inside it), even into another tab.

## v8.0 — Nexo Ahks
- Renamed to **Nexo Ahks**, new logo, app/installer icon, installer sidebar. Your old projects and settings carry over automatically.
- **One-click fixes** on lint problems (🔧 button), plus **Fix all**.
- **Variables panel**: every variable, how many blocks use it, rename everywhere (text in quotes is left alone).
- **Versions**: snapshots saved automatically on run/save/compile, name them, restore any time.
- **Share**: `↗ Share` saves a normal `.ahk` that also carries your blocks. Opening it in Nexo Ahks gives back the exact blocks.
- **Drag a block onto another tab** to move it (hold Ctrl to copy).
- **Recorder**: captures mouse drags, scrolling, and trims long pauses.
- **UI Designer**: drag the window edges/corner to resize, stack vertically/horizontally, fit window with equal padding, anchors (stretch / stay on the edge when the window resizes), dark/midnight/Nexo/high-contrast themes (incl. dark title bar), font packs, jump from a control to its function and from a block to its control.
- **First-run tour**: a 6-step "make your first clicker" walkthrough (also under `?`).

## v8.1
- **Favorites and Recent**: right-click any block in the list to pin it. The last blocks you used show up at the top.
- **💬 Explain**: a plain-English sentence under every block that has blocks inside ("When I press F1: Click → Wait 50 ms"). It is always shown when a block is collapsed.
- **▶ Test this block**: on key/hotstring blocks. Runs just that block once, after a 3 second countdown so you can switch windows.
- **AutoHotkey v1 import**: opening an old v1 script converts the common commands (Send, Sleep, MsgBox, Click, Run, ToolTip, MouseMove, Loop, `X::` + `return` hotkeys, `%var%`, `#IfWinActive`, `#NoEnv`…) to v2. Lines it cannot convert are kept as they were and counted in the status bar.
