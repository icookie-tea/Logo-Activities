#!/usr/bin/env bash
set -e

UUID="logoactivities@icookie-tea.github.com"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${HOME}/.local/share/gnome-shell/extensions/${UUID}"

echo "Compiling GSettings schema..."
glib-compile-schemas "${SCRIPT_DIR}/${UUID}/schemas/"

echo "Installing extension..."
mkdir -p "${HOME}/.local/share/gnome-shell/extensions"
rm -rf "${INSTALL_DIR}"
cp -r "${SCRIPT_DIR}/${UUID}" "${HOME}/.local/share/gnome-shell/extensions/"

echo ""
echo "Installation complete. Restart GNOME Shell to apply:"
echo "  Wayland: log out and back in"
