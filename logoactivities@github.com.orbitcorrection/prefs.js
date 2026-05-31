import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ActivitiesInLPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.set_search_enabled(true);

        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        // ── Icon group ──
        const iconGroup = new Adw.PreferencesGroup({title: _('Icon')});
        page.add(iconGroup);

        // Show Icon
        const showIconRow = new Adw.SwitchRow({title: _('Show Icon')});
        settings.bind('icon', showIconRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        iconGroup.add(showIconRow);

        // Icon Size
        const iconSizeRow = new Adw.SpinRow({
            title: _('Icon Size'),
            adjustment: new Gtk.Adjustment({
                lower: 16, upper: 32, step_increment: 2,
                value: settings.get_int('icon-size'),
            }),
        });
        settings.bind('icon-size', iconSizeRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        iconGroup.add(iconSizeRow);

        // Icon Source
        const sourceModel = new Gtk.StringList();
        sourceModel.append(_('Named Icon'));
        sourceModel.append(_('Custom File'));
        const sourceRow = new Adw.ComboRow({
            title: _('Icon Source'),
            model: sourceModel,
        });
        sourceRow.selected = settings.get_string('icon-type') === 'file' ? 1 : 0;
        iconGroup.add(sourceRow);

        // Icon Name row (named)
        const nameEntry = new Gtk.Entry({
            placeholder_text: 'start-here',
            hexpand: true,
            valign: Gtk.Align.CENTER,
        });
        const nameRow = new Adw.ActionRow({title: _('Icon Name')});
        nameRow.add_suffix(nameEntry);
        settings.bind('icon-name', nameEntry, 'text', Gio.SettingsBindFlags.DEFAULT);
        iconGroup.add(nameRow);

        // Custom File row
        const fileRow = new Adw.ActionRow({title: _('Custom File')});
        const chooseBtn = Gtk.Button.new_with_label(_('Browse…'));
        const clearBtn = Gtk.Button.new_with_label(_('Clear'));
        chooseBtn.valign = Gtk.Align.CENTER;
        clearBtn.valign = Gtk.Align.CENTER;
        fileRow.add_suffix(chooseBtn);
        fileRow.add_suffix(clearBtn);
        iconGroup.add(fileRow);

        // File chooser
        const fileFilter = new Gtk.FileFilter();
        fileFilter.set_name(_('Images'));
        fileFilter.add_pixbuf_formats();
        fileFilter.add_pattern('*.svg');

        const fileChooser = new Gtk.FileChooserNative({
            title: _('Select an Icon'),
            filter: fileFilter,
            modal: true,
        });

        function updateFileRow() {
            const path = settings.get_string('icon-file');
            if (path) {
                const file = Gio.File.new_for_commandline_arg(path);
                fileRow.subtitle = file.query_exists(null) ? path : _('File not found: ') + path;
                clearBtn.sensitive = true;
            } else {
                fileRow.subtitle = _('No file selected');
                clearBtn.sensitive = false;
            }
        }
        updateFileRow();

        chooseBtn.connect('clicked', () => {
            const currentFile = settings.get_string('icon-file');
            if (currentFile) {
                const file = Gio.File.new_for_commandline_arg(currentFile);
                if (file.query_exists(null))
                    fileChooser.set_file(file);
            }
            fileChooser.transient_for = window;
            fileChooser.show();
        });

        clearBtn.connect('clicked', () => {
            settings.set_string('icon-file', '');
            updateFileRow();
        });

        fileChooser.connect('response', (dlg, response) => {
            if (response === Gtk.ResponseType.ACCEPT) {
                settings.set_string('icon-file', dlg.get_file().get_path());
                updateFileRow();
            }
        });

        // Toggle name / file rows based on source
        function updateSourceRows() {
            const isNamed = sourceRow.selected === 0;
            nameRow.visible = isNamed;
            fileRow.visible = !isNamed;
            settings.set_string('icon-type', isNamed ? 'named' : 'file');
        }
        sourceRow.connect('notify::selected', updateSourceRows);
        updateSourceRows();

        // ── Label group ──
        const labelGroup = new Adw.PreferencesGroup({title: _('Label')});
        page.add(labelGroup);

        // Show Label
        const showLabelRow = new Adw.SwitchRow({title: _('Show Label')});
        settings.bind('label', showLabelRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        labelGroup.add(showLabelRow);

        // Label Text
        const textEntry = new Gtk.Entry({
            placeholder_text: 'Activities',
            hexpand: true,
            valign: Gtk.Align.CENTER,
        });
        const textRow = new Adw.ActionRow({title: _('Label Text')});
        textRow.add_suffix(textEntry);
        settings.bind('text', textEntry, 'text', Gio.SettingsBindFlags.DEFAULT);
        labelGroup.add(textRow);

        // ── Behavior group ──
        const behaviorGroup = new Adw.PreferencesGroup({title: _('Behavior')});
        page.add(behaviorGroup);

        const scrollRow = new Adw.SwitchRow({title: _('Desktop Scroll')});
        settings.bind('scroll', scrollRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(scrollRow);

        const popupRow = new Adw.SwitchRow({title: _('Popup Indicator')});
        settings.bind('popup', popupRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(popupRow);
    }
}
