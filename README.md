# Nexo Ahks
Block-based AutoHotkey v2 script builder (Electron).

## Run
    npm install
    npm start

## Build the Windows EXE
- On Windows: `npm run dist` -> installer + portable exe in `dist/`
- No Windows? Push to GitHub and run the "Build Windows EXE" action (Actions tab, or push a `v*` tag), then download the artifact.

## Notes
- `npm test` runs a quick self-test (all blocks, importer, templates, key shortcuts).
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

## v8.2
- **29 new blocks**: regex (match / replace / if matches), lists (make, add, get, length, take last, random), maps (make, set, get, if has), for each file, for each piece of text, skip to next repeat, wait a random time, click a random spot, run a command and keep its output, stopwatch (start / read), registry read/write, environment value, screen size, window class / program, click-through windows, and "when the script is closing".
- **13 new UI elements**: heading, helper text, badge, card, green/red/purple buttons, toggle button, read-only box, log box, vertical line / slider / progress bar.
- Bug fixes: text containing new lines or tabs made the generated script invalid (window titles, control text, messages). Now escaped and read back correctly. The two copies of the "which blocks make variables" list are now one list.
- Your data folder is also found for people who ran it from source (`ahk-blocks` folder).

## v8.3
- **11 new templates** in the gallery: random-spot clicker, paste clipboard as clean text, random item from a list, click-through window, run a command and show the result, count files in a folder, show screen size, stopwatch, say goodbye on exit, a **dark sign-in form** and a **log box** window.

## v8.4
- **Select several blocks**: Ctrl-click (or Shift-click) to add blocks, or Ctrl+A for everything at that level. Delete, Ctrl+D, Ctrl+C / Ctrl+V and Alt+Up/Down then work on all of them. **▾▸ Fold all** collapses or expands every container.
- **Update check**: on start the app asks GitHub for the latest release of the repo named in `package.json` → `repository` (currently `itsnexoria/nexo-ahks`, change it to your real repo) and shows a "Download" toast when a newer version exists. Switch it off by putting `"updateCheck": false` in `config.json` in the app's data folder.

## v8.5
- **Find a block**: Ctrl+Shift+F opens a search over every block in the script (by its text or its code). Click a result or press Enter to jump to it.
- **Copy / paste controls** in the UI Designer: Ctrl+C / Ctrl+V works on one or many controls (tabs bring their children), also between scripts. Names stay unique automatically.

## v9.0
**More blocks (31 new, 286 total)**: format text, to number, if is a number, capitalize, for each list item / map entry, join list, remove/set/empty list items, remove from map, map size, when the clipboard changes, when an error happens, idle time, system values (user name, desktop folder…), file size, make a shortcut, window state, snap window left/right/top/bottom/center, window position and size, monitor count, web view go/back/forward/refresh, tree add/empty/selected item, control font and text color, flash window, make window see-through.

**More UI elements**: **Tree view** and **Web view** (embeds a page using the old IE engine; fine for simple pages and tools, not for modern sites).

**More UI customization**
- Window: opens at (center / exact spot / bottom-right), smallest and largest size, see-through window, and Windows 11 extras: rounded or square corners, Mica / Acrylic / Mica Alt backdrop, title bar color, title text color and border color.
- Every control: hover tip, skip when pressing Tab, see-through background.
- Edit: force UPPER/lower case, no line wrapping. Checkbox: three states, box on the right. Slider: vertical, no ticks, tick interval, value bubble, arrow step. Progress: vertical, classic blocky bar. ListView: grid lines, no header, checkbox per row, single row select. ListBox/Dropdown: sorted. Tab: button style, tabs at bottom. Picture: keep shape. Web view: address.
- Vertical sliders/progress bars, tree views and web views now show properly in the designer.

**Fixes**: the generic importer now reads the new loop blocks; Windows 11 settings survive theme changes.

## v9.0.1
- **Fixed a start-up crash** (`Cannot access 'handle' before initialization`) introduced in v8.4 by the update checker. `npm test` now also loads `main.js` and `preload.js` against a fake Electron, so this kind of start-up mistake is caught before shipping (and in the GitHub Action before it builds).
- Note: newer npm versions print an `install-scripts` warning for Electron's postinstall. If Electron's binary is missing after `npm install`, run `npm install-scripts approve electron` (or `node node_modules/electron/install.js`).

## v10.0 — value blocks (Scratch / Sketchware style)
- **Input slots you can see**: every input on a block is now a white rounded slot with a hint ("value", "text"). Slots that accept value blocks glow when you drag one.
- **VALUE BLOCKS** in the block list (everything is a block now): **Math** (+ − × ÷ % whole-divide, power, round, abs, round down/up, square root, smaller/bigger of, random), **Compare** (= != > < >= <= and "contains"), **Logic** (and / or, not, true/false, if-then-else), **Text** (join, length, UPPER/lower, trim, letters of, replace, position), **Sensing** (key held, mouse x/y, color at, clipboard, time, screen size, idle time, window/program/file exists, value of a control), **Lists/maps** (item of list, length, map has/get) and **Your variables** (always lists the variables you created, plus the loop counter).
- **Drag a value block into any white slot, even into another value block** (e.g. `set total to (score + 5) × 2`, `if (total > 10)`, `message join "Total: " and total`). Drag a placed value block to another slot to move it, drag it away or press its × to remove it. Prefer clicking? Click inside a slot first, then click a value block.
- Blocks read like sentences now: `if [ ] then`, `otherwise`, `try this`, `if it fails`.
- Renaming a variable also renames it inside value blocks, and the problem checker tells you when a value block uses a variable that nothing sets.
- Your old scripts open unchanged; imported code keeps its expressions as typed text in the slots.

## v11.0 — a new look
- **New design system**: richer dark and light themes, brand gradient, glow and depth, smoother motion, thin scrollbars, softer shadows, glass dialogs with a blurred backdrop.
- **Header**: gradient wordmark with your logo, pill tabs with an accent top line, a segmented Blocks / UI Designer / Code switch, one-click theme icon.
- **One-row toolbar**: grouped buttons, icon-only Undo / Redo / Fold / Explain, a big glowing Run button.
- **Block list split in two tabs**: **⚡ Actions** and **🧮 Values** (it jumps to Values when you click an input slot). Search looks in both. Tips live in a collapsible box.
- **Blocks**: deeper category colors (amber events, blue control, green keys, purple mouse, teal data blocks, pink UI), glossy highlight, dotted canvas, calmer action buttons that light up on hover, a friendlier empty-canvas message.
- **Home**: bigger gradient title, search with icon, cards with an accent edge that lift on hover and glow green when running.
- **UI Designer**: controls grouped into Basics / Type in / Choose / Show data / Layout / Styled buttons with icons, a tidier toolbar, dotted stage.
- **Templates**: two-column gallery with search. **Help**: new shortcuts.

## v11.2 (audit pass)
- **Debug** (🐞 button or Ctrl+F5): runs your script with a bottom panel that highlights the running block, shows variables and logs. Modes: Fast, Slow, Step (press F8 per block). New Debug blocks: Log, Log with time, Pause here. Helper functions are added to the script only when a block needs them.
- **Importer / lint fixes**: `static`/`local` variables are no longer also declared `global` (that was a load error in AutoHotkey); the Problems panel knows every AutoHotkey v2 built-in and ignores letter case, and stays quiet about unknown functions when the script uses `#Include`; AutoHotkey v1 `IfWinActive`, `IfWinExist`, `IfExist`, `IfInString`, `IfEqual` (and their `Not` forms) are converted.
- **Faster canvas**: unchanged blocks are reused instead of rebuilt on every click (about 4x less work on a 300-block script in tests).
- Test fixes: window-corner drag and value-block remove tests no longer depend on jsdom quirks.
- `npm test` now also checks debug builds, the new importer rules and that the cached canvas equals a fresh one.

## v11.5
- **My blocks**: "＋ Make a block" in the palette creates your own block from a name and optional inputs (and can give a value back). Use it anywhere, drag it into slots when it returns a value. Imported scripts turn calls to their own functions into My blocks automatically.
- **More value blocks**: random item, split, join list, current date/time, date plus/minus/format, key just pressed, mouse inside area. Variables now have types (worked out automatically, or set in the Variables panel) and the Problems panel warns when a number is used as a list or map.
- **Sticky notes, colour tags, comments**: right-click any block to colour-tag it or attach a comment that is saved in the script as `; ...`.

## v11.6
- **Screen tools**: blocks that need a picture get a 📷 button (drag a box on the frozen screen, the picture is saved and shown as a thumbnail), colour fields get a 🎨 button (magnifier, click to pick) and x/y fields get 🎯 (click a spot). Esc or right-click cancels. Opens on the screen where your mouse is.

## v11.7
- **🧪 Try it** (toolbar): runs your script inside Nexo Ahks, with no AutoHotkey needed. Your window appears with real clickable widgets, buttons run their code, resize it with the sliders to test anchors, press hotkeys from the Hotkeys tab, and watch the Log (messages, sends, clicks, problems) and Variables. Keyboard, mouse and files are pretend, so nothing is really sent or changed. If something would make real AutoHotkey show an error (like adding to an empty variable) Try it shows that same error. Things it cannot do are listed in the Log instead of being silently skipped.

## v11.8
- **Importing your own scripts now brings in the window and its controls**, including scripts written by hand: `AddText()`/`AddEdit()`/`AddButton()` style, controls without x/y positions (AutoHotkey's automatic layout is reproduced), windows built inside a function, tabs, chained `.OnEvent(...)`, `MyGui.Title := ...`, code mixed in between the controls, and old AutoHotkey v1 `Gui, Add, ...` scripts with their labels. Only the first window of a script becomes editable in the UI Designer; any others keep working as code.
- **Color picker button**: tick it on a Button in the UI Designer, click it in your script, then click any color on screen. Use the “picked color of …” value block to read it.
- **ListView columns**: set each column to text, number or decimal (sorts correctly) and optionally fit the column widths to the text.
- **Saved looks**: save a window's colors, fonts and theme under a name and apply it to any other window (Window properties, Look section).

## v11.9
- **Much better import of real scripts.** Whole classes and other code the blocks cannot express stay together as one raw block instead of one block per line; `if`/`for`/`try` without braces, `x++`, `x .= ...`, `obj.Method(...)`, `obj.Prop := ...`, `catch as e` and `Global X := ...` all become real blocks; variables keep the scope the original had (no more extra `global` or `x := 0` lines); windows with variables in their options, a `global` declaration, or a custom size import correctly; stacked "page" controls are hidden in the Designer behind a toggle.
- **Compile dialog** (name, version, company, description, copyright, icon, run as administrator), **Help → Self-check**, and a **friendly crash dialog** with a problem log.
- **Toolbar fixed** so it always sits on one row, with new automated layout and end-to-end tests that run the real app.

## v12
- **Games** blocks: move the mouse by an amount, turn the camera smoothly, and click in a way games accept. These send *relative* mouse input, so they work in Minecraft and in Roblox with shift lock, where the normal "move mouse to x, y" does nothing because the game keeps the cursor locked. Use "Hold key for N ms" for keys games ignore when tapped too fast (Roblox shift lock is `LShift`).
- **Background** blocks: click or press keys in a window without moving your mouse or focusing it (including window-message versions for games), scroll or type into a background window, and wait for a window with a timeout.
- **Options**: hide the tray icon so the script runs completely in the background, set the priority (Low is best next to a game), and one button for game-friendly input.
- **Templates** for camera turning, shift lock, a game auto clicker and a background clicker.
- **Help → Program locations** shows which AutoHotkey and compiler the app uses, lets you choose them, and **resets** a wrong choice. A wrong file can no longer get stuck: picks are checked and clearly wrong saved paths are ignored.
