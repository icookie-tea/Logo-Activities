# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GNOME Shell extension ("Activities Icon & Label") that replaces the default "Activities" button in the GNOME top panel with a customizable icon and/or text label. It also supports scroll-to-switch-workspaces and an optional workspace indicator in the right panel area.

- **UUID**: `logoactivities@github.com.orbitcorrection`
- **Supported shell versions**: 45, 46, 47, 48, 49, 50
- **License**: GPL-2.0-or-later

## Architecture

The extension is a single-directory GNOME Shell extension using ESM (ES modules) with GJS imports from `gi://` (GNOME introspection) and `resource:///org/gnome/shell/`.

### `extension.js` — Main extension code

Four custom widget classes, registered via `GObject.registerClass`:

- **`ActivitiesIndicator`** — The primary replacement Activities button on the left side of the panel. Contains three children in an `St.BoxLayout`: an `_iconBox` (`St.Bin`), a `_label` (`St.Label`), and `_workspaceIndicators` (`WorkspaceIndicators`). Handles overview toggle on click/keypress, DND activation, and workspace scrolling via scroll events. **Layout behavior**: icon visibility is controlled by the `icon` setting; label and workspace dots are mutually exclusive — label replaces dots when enabled.
- **`WorkspaceDot`** — Animated workspace dot actor with `expansion` (0–1) and `width-multiplier` properties. Supports `scaleIn()` and `scaleOutAndDestroy()` transitions.
- **`WorkspaceIndicators`** — Container that creates/reparents/destroys `WorkspaceDot` children based on `Main.createWorkspacesAdjustment`. Manages dot expansion based on distance from active workspace. Now integrated directly into `ActivitiesIndicator` rather than in a separate right-side button.
- **`ActivitiesButton`** — Optional right-side panel button for workspace indicators (controlled by `panel-indicator` setting). Separate from the main `ActivitiesIndicator`.
- **`ActivitiesExtension`** — Entry point. On `enable()`: hides stock activities button, creates `ActivitiesIndicator` on the left, and conditionally creates `ActivitiesButton` on the right. On `disable()`: destroys widgets and restores stock button.

#### Icon source support

`_set_icon()` supports two modes via the `icon-type` setting:
- **`'named'`** (default): Uses `St.Icon.icon_name` from the `icon-name` GSettings key. Falls back to `'start-here'`.
- **`'file'`**: Uses `Gio.FileIcon` + `St.Icon.gicon` from the `icon-file` GSettings path. If the file doesn't exist, falls back to named icon.

### `prefs.js` — Preferences UI

Uses GTK widgets organized in three framed sections:

1. **Icon Settings** — Show toggle, icon source radio buttons (Named Icon / Custom File), named icon text entry, file chooser section (Browse/Clear buttons, path display with validation)
2. **Label Settings** — Show toggle, label text entry
3. **Behavior** — Desktop Scroll, Popup Indicator, Panel Indicator toggles

File validation: the path label shows the selected path in grey, or a red "Not found" warning if the file is missing. Uses `Gtk.FileChooserNative` with an image filter (`add_pixbuf_formats()` + `*.svg`).

### `schemas/org.gnome.shell.extensions.logoactivities.gschema.xml`

GSettings keys:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `icon` | bool | `true` | Show icon |
| `icon-name` | string | `'start-here'` | Named icon to use (when `icon-type` is `'named'`) |
| `icon-type` | string | `'named'` | Icon source: `'named'` or `'file'` |
| `icon-file` | string | `''` | File path for custom icon (when `icon-type` is `'file'`) |
| `label` | bool | `false` | Show text label (replaces workspace dots when on) |
| `text` | string | `'Activities'` | Label text |
| `scroll` | bool | `true` | Enable workspace scrolling on the button |
| `popup` | bool | `false` | Show workspace switcher popup when scrolling |
| `panel-indicator` | bool | `false` | Show workspace indicators on the right panel |

### `stylesheet.css`

Styles the icon (`.activities-icon`, 16px symbolic), layout spacing (`.activities-layout`, 6px), and panel button padding.

## Development

No build system, bundler, or test suite exists. The extension is installed as a directory symlink or copy.

### Installing for testing

```bash
ln -s "$PWD/logoactivities@github.com.orbitcorrection" ~/.local/share/gnome-shell/extensions/logoactivities@github.com.orbitcorrection
```

### Enabling / debugging

```bash
# Enable the extension
gnome-extensions enable logoactivities@github.com.orbitcorrection

# Open preferences UI
gnome-extensions prefs logoactivities@github.com.orbitcorrection

# View extension logs
journalctl -f -o cat /usr/bin/gnome-shell
```

### Restarting GNOME Shell after code changes

In a nested session (recommended for development):
```bash
dbus-run-session -- gnome-shell --nested --wayland
```

Or on the running session: press `Alt+F2`, type `r`, press Enter (X11 only; on Wayland, log out and back in).

### Schema compilation

```bash
glib-compile-schemas logoactivities@github.com.orbitcorrection/schemas/
```

## Key GNOME Shell API patterns used

- **PanelMenu.Button** — Base class for all panel buttons; handles menu, DND, accessibility
- **Clutter.Actor** — Base actor class for `WorkspaceDot`
- **St (Shell Toolkit)** — CSS-styled widgets (`St.Bin`, `St.BoxLayout`, `St.Icon`, `St.Label`, `St.Widget`)
- **Gio.FileIcon** — GIcon implementation for file-based icons; set as `gicon` on `St.Icon`
- **Main.overview** — Global overview controller (`showing`/`hiding` signals, `toggle()`, `shouldToggleByCornerOrButton()`)
- **Main.panel** — Panel singleton for `addToStatusArea()` and `statusArea[]` access
- **Main.createWorkspacesAdjustment** — Creates adjustment tracking active workspace and count
- **global.workspace_manager** — Workspace state (`get_active_workspace_index()`, `n_workspaces`, `layout_rows`)
- **Gio.Settings** — GSettings binding
- **GLib** — Main loop utilities (`timeout_add`, `source_remove`, `SOURCE_REMOVE`)
