#!/bin/bash
# Raspberry Pi OS Lite 64-bit, Bookworm or later. Run as the normal Pi user.
set -euo pipefail
if [ "$(id -u)" -eq 0 ]; then echo 'Run as the Pi user, not root.'; exit 1; fi
if [ "$(dpkg --print-architecture)" != arm64 ]; then echo 'Use Raspberry Pi OS Lite 64-bit.'; exit 1; fi
. /etc/os-release
if [ "${VERSION_ID:-0}" -lt 12 ]; then echo 'Use Raspberry Pi OS Bookworm or later.'; exit 1; fi
USER_NAME=$(id -un)
DEST=/opt/bazzpi-shelf
REF="${BAZZPI_UPDATE_REF:-main}"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
# Download a complete revision before touching the installed shelf.
git clone --depth 1 --branch "$REF" https://github.com/dbrush95/pibazz.git "$STAGE/repo" 2>/dev/null || {
  sudo apt-get update
  sudo apt-get install -y git ca-certificates
  git clone --depth 1 --branch "$REF" https://github.com/dbrush95/pibazz.git "$STAGE/repo"
}
SHA=$(git -C "$STAGE/repo" rev-parse HEAD)
sudo apt-get update
sudo apt-get install -y labwc seatd xwayland chromium foot wlrctl python3 nodejs curl \
  ca-certificates dbus-user-session pipewire pipewire-pulse wireplumber \
  libspa-0.2-bluetooth bluez fonts-noto-core raspi-config avahi-daemon libnss-mdns
# Use the Pi-specific package source (generic Debian builds may lack Pi decoding).
curl -fsSL --connect-timeout 10 --max-time 60 \
  https://dl.cloudsmith.io/public/moonlight-game-streaming/moonlight-qt/setup.deb.sh -o "$STAGE/moonlight-repo.sh"
sudo env distro=raspbian codename="$(lsb_release -cs)" bash "$STAGE/moonlight-repo.sh"
sudo apt-get install -y moonlight-qt
# RetroArch is optional; unavailable cores must not prevent streaming setup.
sudo apt-get install -y retroarch libretro-core-info || echo 'RetroArch unavailable; streaming still works.'
for pkg in libretro-nestopia libretro-snes9x libretro-gambatte libretro-mgba libretro-genesisplusgx; do
  sudo apt-get install -y "$pkg" || true
done
python3 -m py_compile "$STAGE/repo/shelf/shelf.py"
node --check "$STAGE/repo/shelf/shelf.js"
sudo mkdir -p "$DEST/releases/$SHA"
sudo cp -a "$STAGE/repo/shelf/." "$DEST/releases/$SHA/"
printf '%s\n' "$SHA" | sudo tee "$DEST/releases/$SHA/revision" >/dev/null
sudo chown -R "$USER_NAME:$(id -gn)" "$DEST"
if [ -L "$DEST/current" ]; then ln -sfn "$(readlink -f "$DEST/current")" "$DEST/previous"; fi
ln -sfn "$DEST/releases/$SHA" "$DEST/current.new"
mv -Tf "$DEST/current.new" "$DEST/current"
# Stable entry point: updated application code is never run as root.
sudo tee /usr/local/bin/bazzpi-shelf >/dev/null <<'LAUNCH'
#!/bin/bash
exec bash /opt/bazzpi-shelf/current/bazzpi-shelf
LAUNCH
sudo chmod 755 /usr/local/bin/bazzpi-shelf
sudo tee /etc/sudoers.d/bazzpi-shelf >/dev/null <<SUDO
$USER_NAME ALL=(root) NOPASSWD: /usr/bin/systemctl reboot, /usr/bin/systemctl poweroff, /usr/bin/hostnamectl, /usr/bin/raspi-config, /usr/bin/timedatectl
SUDO
sudo chmod 440 /etc/sudoers.d/bazzpi-shelf
sudo visudo -cf /etc/sudoers.d/bazzpi-shelf
for group in video render input audio netdev seat _seatd; do
  if getent group "$group" >/dev/null; then sudo usermod -aG "$group" "$USER_NAME"; fi
done
sudo systemctl enable seatd bluetooth avahi-daemon
systemctl --user enable pipewire.socket pipewire-pulse.socket wireplumber.service || true
# Boot hardware changes happen only during installation, never during shelf startup.
for cfg in /boot/firmware/config.txt /boot/config.txt; do
  if [ -f "$cfg" ]; then
    sudo cp -n "$cfg" "$cfg.bazzpi-backup" || true
    sudo sed -i '/^gpu_mem=/d' "$cfg"
    printf '\n[all]\ngpu_mem=128\n' | sudo tee -a "$cfg" >/dev/null
    break
  fi
done
sudo raspi-config nonint do_boot_behaviour B2
mkdir -p "$HOME/.config/bazzpi/labwc" "$HOME/ROMs" "$HOME/.local/share/themes/Bazzpi/openbox-3"
for dir in nes snes gb gbc gba mastersystem megadrive gamegear segacd pcengine neogeo fbneo psx n64 dreamcast psp nds; do mkdir -p "$HOME/ROMs/$dir"; done
# Preserve the user's existing labwc configuration by using a separate config dir.
cat > "$HOME/.config/bazzpi/labwc/autostart" <<'AUTO'
systemctl --user import-environment WAYLAND_DISPLAY DISPLAY XDG_CURRENT_DESKTOP
/usr/local/bin/bazzpi-shelf &
AUTO
cat > "$HOME/.config/bazzpi/labwc/rc.xml" <<'RC'
<?xml version="1.0"?>
<labwc_config>
  <theme><name>Bazzpi</name><cornerRadius>12</cornerRadius><font place="ActiveWindow"><name>Noto Sans</name><size>11</size></font></theme>
  <keyboard>
    <default />
    <keybind key="W-h"><action name="Execute" command="wlrctl toplevel focus title:Bazzpi" /></keybind>
    <keybind key="C-A-t"><action name="Execute" command="foot" /></keybind>
  </keyboard>
  <windowRules>
    <windowRule title="Bazzpi"><serverDecoration>no</serverDecoration></windowRule>
  </windowRules>
</labwc_config>
RC
cat > "$HOME/.local/share/themes/Bazzpi/openbox-3/themerc" <<'THEME'
border.width: 1
padding.height: 10
window.active.title.bg.color: #f3f6f9
window.active.label.text.color: #1c1f24
window.active.border.color: #d5dce4
window.inactive.title.bg.color: #e4ebf2
window.inactive.label.text.color: #5c6772
window.inactive.border.color: #d5dce4
window.active.button.unpressed.image.color: #1c1f24
window.inactive.button.unpressed.image.color: #5c6772
THEME
if [ ! -f "$HOME/.bash_profile" ]; then printf '%s\n' '[ -f "$HOME/.profile" ] && . "$HOME/.profile"' > "$HOME/.bash_profile"; fi
cp -n "$HOME/.bash_profile" "$HOME/.bash_profile.bazzpi-backup" || true
# Upgrade the original installer's known launch line without adding a second session.
if grep -q 'exec labwc' "$HOME/.bash_profile"; then
  sed -i 's|exec labwc.*|exec dbus-run-session labwc -C "$HOME/.config/bazzpi/labwc"|' "$HOME/.bash_profile"
else
  cat >> "$HOME/.bash_profile" <<'PROFILE'

# Bazzpi: local TV only. SSH remains a normal terminal.
if [ -z "${WAYLAND_DISPLAY:-}" ] && [ "$(tty)" = /dev/tty1 ]; then
  exec dbus-run-session labwc -C "$HOME/.config/bazzpi/labwc"
fi
PROFILE
fi
# Remove only the old shelf autostart, not unrelated user customizations.
if [ -f "$HOME/.config/labwc/autostart" ]; then sed -i '\|/usr/local/bin/bazzpi-shelf|d' "$HOME/.config/labwc/autostart"; fi
printf '\nInstalled %s. Reboot, then open Play → Test connection.\n' "$SHA"
