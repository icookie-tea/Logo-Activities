import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const KEY_LABEL = 'label';
const KEY_POPUP = 'popup';
const KEY_TEXT = 'text';
const KEY_ICON = 'icon';
const KEY_ICONNAME = 'icon-name';
const KEY_SCROLL = 'scroll';
const KEY_ICON_SIZE = 'icon-size';
const KEY_ICON_TYPE = 'icon-type';
const KEY_ICON_FILE = 'icon-file';

function buildPrefsWidget(settings) {
    let widget = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
        spacing: 10,
    });

    // --- Icon Settings ---
    let iconFrame = new Gtk.Frame({label: 'Icon Settings'});
    let iconVbox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
        spacing: 8,
    });

    iconVbox.append(addItemSwitch('Show Icon', KEY_ICON, settings));

    // Icon size scale
    let sizeHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5});
    let sizeLabel = new Gtk.Label({label: 'Icon size:', xalign: 0, hexpand: true});
    sizeHbox.append(sizeLabel);
    let sizeAdjustment = new Gtk.Adjustment({
        lower: 16, upper: 33, step_increment: 2,
        value: settings.get_int(KEY_ICON_SIZE),
    });
    let sizeScale = new Gtk.Scale({
        orientation: Gtk.Orientation.HORIZONTAL,
        adjustment: sizeAdjustment,
        digits: 0,
        hexpand: true,
    });
    sizeScale.set_size_request(120, -1);
    let sizeValue = new Gtk.Label({
        label: `${settings.get_int(KEY_ICON_SIZE)} px`,
        xalign: 1,
        width_chars: 6,
    });
    sizeScale.connect('value-changed', scale => {
        const val = scale.get_value();
        settings.set_int(KEY_ICON_SIZE, val);
        sizeValue.set_label(`${val} px`);
    });
    sizeHbox.append(sizeScale);
    sizeHbox.append(sizeValue);
    iconVbox.append(sizeHbox);

    // Icon type radio buttons
    let typeHbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5});
    let typeLabel = new Gtk.Label({label: 'Icon source:', xalign: 0, hexpand: true});
    typeHbox.append(typeLabel);

    let namedRadio = new Gtk.CheckButton({label: 'Named Icon', margin_end: 10});
    let fileRadio = new Gtk.CheckButton({label: 'Custom File', group: namedRadio});
    typeHbox.append(namedRadio);
    typeHbox.append(fileRadio);

    const iconType = settings.get_string(KEY_ICON_TYPE);
    if (iconType === 'file')
        fileRadio.active = true;
    else
        namedRadio.active = true;

    // Named icon entry
    let namedEntryBox = addText(KEY_ICONNAME, 'Enter icon name', settings);

    // File chooser section
    let fileBox = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, spacing: 5});

    let fileBtnBox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 5});
    let chooseBtn = new Gtk.Button({label: 'Browse...', hexpand: false});
    let clearBtn = new Gtk.Button({label: 'Clear', hexpand: false});
    fileBtnBox.append(chooseBtn);
    fileBtnBox.append(clearBtn);
    fileBox.append(fileBtnBox);

    let filePathLabel = new Gtk.Label({xalign: 0, hexpand: true, wrap: true, margin_top: 3, selectable: true});
    fileBox.append(filePathLabel);

    let fileFilter = new Gtk.FileFilter();
    fileFilter.set_name('Images');
    fileFilter.add_pixbuf_formats();
    fileFilter.add_pattern('*.svg');

    let fileChooser = new Gtk.FileChooserNative({
        title: 'Select an Icon',
        filter: fileFilter,
        modal: true,
    });

    function escapeMarkup(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function updateFilePathDisplay() {
        const path = settings.get_string(KEY_ICON_FILE);
        if (path) {
            const file = Gio.File.new_for_commandline_arg(path);
            if (file.query_exists(null)) {
                filePathLabel.set_markup('<span color="#888888">' + escapeMarkup(path) + '</span>');
            } else {
                filePathLabel.set_markup('<span color="#cc0000"><b>Not found:</b> ' + escapeMarkup(path) + '</span>');
            }
            clearBtn.sensitive = true;
        } else {
            filePathLabel.set_markup('<i>No file selected</i>');
            clearBtn.sensitive = false;
        }
    }

    chooseBtn.connect('clicked', () => {
        const currentFile = settings.get_string(KEY_ICON_FILE);
        if (currentFile) {
            const file = Gio.File.new_for_commandline_arg(currentFile);
            if (file.query_exists(null))
                fileChooser.set_file(file);
        }
        fileChooser.transient_for = widget.get_root();
        fileChooser.show();
    });

    clearBtn.connect('clicked', () => {
        settings.set_string(KEY_ICON_FILE, '');
        updateFilePathDisplay();
    });

    fileChooser.connect('response', (dlg, response) => {
        if (response === Gtk.ResponseType.ACCEPT) {
            settings.set_string(KEY_ICON_FILE, dlg.get_file().get_path());
            updateFilePathDisplay();
        }
    });

    function updateIconTypeSections() {
        if (fileRadio.active) {
            namedEntryBox.visible = false;
            fileBox.visible = true;
            settings.set_string(KEY_ICON_TYPE, 'file');
        } else {
            namedEntryBox.visible = true;
            fileBox.visible = false;
            settings.set_string(KEY_ICON_TYPE, 'named');
        }
    }

    namedRadio.connect('toggled', updateIconTypeSections);
    fileRadio.connect('toggled', updateIconTypeSections);

    updateFilePathDisplay();
    updateIconTypeSections();

    iconVbox.append(typeHbox);
    iconVbox.append(namedEntryBox);
    iconVbox.append(fileBox);
    iconFrame.set_child(iconVbox);
    widget.append(iconFrame);

    // --- Label Settings ---
    let labelFrame = new Gtk.Frame({label: 'Label Settings'});
    let labelVbox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
        spacing: 8,
    });
    labelVbox.append(addItemSwitch('Show Label', KEY_LABEL, settings));
    labelVbox.append(addText(KEY_TEXT, 'Enter label text', settings));
    labelFrame.set_child(labelVbox);
    widget.append(labelFrame);

    // --- Behavior Settings ---
    let behaviorFrame = new Gtk.Frame({label: 'Behavior'});
    let behaviorVbox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
        spacing: 8,
    });
    behaviorVbox.append(addItemSwitch('Desktop Scroll', KEY_SCROLL, settings));
    behaviorVbox.append(addItemSwitch('Popup Indicator', KEY_POPUP, settings));
    behaviorFrame.set_child(behaviorVbox);
    widget.append(behaviorFrame);

    widget.set_size_request(550, -1);

    return widget;
}

function addItemSwitch(label, key, gsettings) {
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin_top: 10});
    let info = new Gtk.Label({xalign: 0, hexpand: true});
    info.set_markup(label);
    hbox.append(info);

    let button = new Gtk.Switch({active: gsettings.get_boolean(key)});
    button.connect('notify::active', btn => { gsettings.set_boolean(key, btn.active); });
    hbox.append(button);
    return hbox;
}

function addText(key, placeholder, gsettings) {
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5});
    let info = new Gtk.Label({xalign: 0, hexpand: true});
    hbox.append(info);

    let entry = new Gtk.Entry({hexpand: true, margin_start: 20});
    entry.set_placeholder_text(placeholder);
    entry.set_text(gsettings.get_string(key));
    entry.connect('changed', e => { gsettings.set_string(key, e.get_text()); });
    hbox.append(entry);
    return hbox;
}

export default class ActivitiesInLPrefs extends ExtensionPreferences {
    getPreferencesWidget() {
        return buildPrefsWidget(this.getSettings());
    }
}
