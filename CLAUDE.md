# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GNOME Shell extension ("Activities Icon & Label") that replaces the default "Activities" button in the GNOME top panel with a customizable icon and/or text label. It integrates workspace indicator dots directly into the replacement button and supports scroll-to-switch-workspaces.

- **UUID**: `logoactivities@github.com.orbitcorrection`
- **Supported shell versions**: 45, 46, 47, 48, 49, 50
- **License**: GPL-2.0-or-later

## Architecture

The extension is a single-directory GNOME Shell extension using ESM (ES modules) with GJS imports from `gi://` (GNOME introspection) and `resource:///org/gnome/shell/`.

### `extension.js` — Main extension code

Three custom widget classes, registered via `GObject.registerClass`:

- **`ActivitiesIndicator`** — The replacement Activities button on the left side of the panel. Extends `PanelMenu.Button`. Contains an `St.BoxLayout` (`_container`, class `activities-layout`) with three children: `_iconBox` (`St.Bin`), `_label` (`St.Label`), and `_workspaceIndicators` (`WorkspaceIndicators`). Handles overview toggle on click/keypress, DND activation, and workspace scrolling via scroll events. **Layout behavior**: icon visibility controlled by `icon` setting; label and workspace dots are mutually exclusive — label replaces dots when enabled.
- **`WorkspaceDot`** — Animated workspace dot actor extending `Clutter.Actor`. Contains an `St.Widget` child with style class `workspace-dot`. Has `expansion` (0–1) and `width-multiplier` properties. Supports `scaleIn()` and `scaleOutAndDestroy()` transitions. Dot sizing comes from CSS `min-width`/`min-height`, matching GNOME Shell's default implementation.
- **`WorkspaceIndicators`** — `St.BoxLayout` container (class `workspace-indicators`, spacing 5px) that creates/reparents/destroys `WorkspaceDot` children based on `Main.createWorkspacesAdjustment`. Manages dot expansion/distance from active workspace. Width multiplier thresholds match GNOME Shell defaults (≤2 → 3.625, ≤5 → 3.25, else 2.75).
- **`ActivitiesExtension`** — Entry point. `enable()`: hides stock activities button, creates `ActivitiesIndicator` on the left. `disable()`: destroys widget and restores stock button.

#### Icon source support

`_set_icon()` supports two modes via the `icon-type` setting:
- **`'named'`** (default): Uses `St.Icon.icon_name` from the `icon-name` GSettings key. Falls back to `'start-here'`.
- **`'file'`**: Uses `Gio.FileIcon` + `St.Icon.gicon` from the `icon-file` GSettings path. Falls back to named icon if file doesn't exist.

Icon size is set programmatically via `St.Icon.icon_size` from the `icon-size` setting (not via CSS).

### `prefs.js` — Preferences UI

Uses libadwaita widgets (`Adw.PreferencesPage`, `Adw.PreferencesGroup`, `Adw.*Row`) following GNOME 45+ conventions:

1. **Icon group** — `Adw.SwitchRow` for show/hide, `Adw.SpinRow` for icon size (16–32, step 2), `Adw.ComboRow` for source (Named Icon / Custom File), `Adw.ActionRow` with `Gtk.Entry` for icon name, `Adw.ActionRow` with Browse/Clear buttons and dynamic subtitle for custom file path.
2. **Label group** — `Adw.SwitchRow` for show/hide, `Adw.ActionRow` with `Gtk.Entry` for label text.
3. **Behavior group** — `Adw.SwitchRow` for Desktop Scroll and Popup Indicator.

Uses `fillPreferencesWindow(window)` (modern API) with `settings.bind()` for bidirectional GSettings binding. File validation shows path in subtitle, with "File not found" prefix for missing files. Search enabled via `window.set_search_enabled(true)`.

### `schemas/org.gnome.shell.extensions.logoactivities.gschema.xml`

GSettings keys:

| Key | Type | Default | Range | Description |
|-----|------|---------|-------|-------------|
| `icon` | bool | `true` | — | Show icon |
| `icon-size` | int | `16` | 16–32 | Icon size in pixels |
| `icon-type` | string | `'named'` | — | Icon source: `'named'` or `'file'` |
| `icon-name` | string | `'start-here'` | — | Named icon to use (when `icon-type` is `'named'`) |
| `icon-file` | string | `''` | — | File path for custom icon (when `icon-type` is `'file'`) |
| `label` | bool | `false` | — | Show text label (replaces workspace dots when on) |
| `text` | string | `'Activities'` | — | Label text |
| `scroll` | bool | `true` | — | Enable workspace scrolling on the button |
| `popup` | bool | `false` | — | Show workspace switcher popup when scrolling |

### `stylesheet.css`

- `.activities-icon` — symbolic icon style (size set programmatically)
- `.activities-layout` — 6px spacing between icon, label, and dots
- `#panel .panel-button#panellogoActivities StBoxLayout` — 0.2045em horizontal padding (matching GNOME default `$scaled_padding * 0.5`)
- `.workspace-indicators` — 5px spacing between dots (matching GNOME default)
- `.workspace-dot` — 0.5455em min dimensions, 999px border-radius (circular), white background

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

On a running session (X11): press `Alt+F2`, type `r`, press Enter. On Wayland, log out and back in.

### Schema compilation

```bash
glib-compile-schemas logoactivities@github.com.orbitcorrection/schemas/
```

## Key GNOME Shell API patterns used

- **PanelMenu.Button** — Base class for panel buttons; handles menu, DND, accessibility, hpadding from CSS `-natural-hpadding`/`-minimum-hpadding`
- **Clutter.Actor** — Base actor class for `WorkspaceDot`; provides layout lifecycle (preferred size, allocate)
- **St (Shell Toolkit)** — CSS-styled widgets (`St.Bin`, `St.BoxLayout`, `St.Icon`, `St.Label`, `St.Widget`)
- **Gio.FileIcon** — GIcon implementation for file-based icons; set as `gicon` on `St.Icon`
- **Main.overview** — Global overview controller (`showing`/`hiding` signals, `toggle()`, `shouldToggleByCornerOrButton()`)
- **Main.panel** — Panel singleton for `addToStatusArea()` and `statusArea[]` access
- **Main.createWorkspacesAdjustment** — Creates adjustment tracking active workspace and count
- **global.workspace_manager** — Workspace state (`get_active_workspace_index()`, `n_workspaces`, `layout_rows`)
- **Gio.Settings** / `settings.bind()` — GSettings binding (bidirectional for Adw rows)
- **Adw.PreferencesPage / Adw.PreferencesGroup / Adw.*Row** — libadwaita preferences widgets
- **GLib** — Main loop utilities (`timeout_add`, `source_remove`, `SOURCE_REMOVE`)
