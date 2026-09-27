#!/bin/bash
# Turns Raspberry Pi OS Lite into the Bazzpi shelf.
# The Pi logs in by itself. The shelf still asks for a profile.
set -euo pipefail
BASE="https://raw.githubusercontent.com/dbrush95/pibazz/main/shelf"
DEST=/opt/bazzpi-shelf
USER_NAME="${SUDO_USER:-$(id -un)}"
HOME_DIR="$(getent passwd "$USER_NAME" | cut -d: -f6)"
export DEBIAN_FRONTEND=noninteractive

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this as the Pi user, not root."
  exit 1
fi

if [ -d /usr/share/rpd-wallpaper ]; then
  echo "This Pi already has the desktop. Use install.sh instead of install-lite.sh."
  exit 1
fi

echo "Installing the screen, Chromium, Moonlight, RetroArch, and a terminal."
sudo apt-get update
sudo apt-get install -y labwc seatd chromium foot raspi-config || sudo apt-get install -y labwc seatd chromium-browser foot
if ! command -v chromium >/dev/null 2>&1 && ! command -v chromium-browser >/dev/null 2>&1; then
  echo "Chromium did not install."
  exit 1
fi

cores=(
  retroarch libretro-core-info
  libretro-nestopia libretro-snes9x libretro-gambatte libretro-mgba
  libretro-genesisplusgx libretro-fbneo libretro-pcsx-rearmed
  libretro-beetle-pce-fast libretro-mupen64plus-next libretro-flycast
  libretro-ppsspp libretro-melonds
)
for pkg in "${cores[@]}"; do
  sudo apt-get install -y "$pkg" || true
done
if ! command -v retroarch >/dev/null 2>&1; then
  echo "RetroArch did not install."
  exit 1
fi

if ! command -v moonlight-qt >/dev/null 2>&1 && ! command -v moonlight >/dev/null 2>&1; then
  curl -1sLf 'https://dl.cloudsmith.io/public/moonlight-game-streaming/moonlight-qt/setup.deb.sh' | sudo bash
  sudo apt-get install -y moonlight-qt || echo "Moonlight did not install. The shelf will still open."
fi

sudo mkdir -p "$DEST"
for file in index.html shelf.css shelf.js shelf.py update.sh bazzpi-shelf; do
  sudo curl -fsSL "$BASE/$file" -o "$DEST/$file"
done
sudo chmod 755 "$DEST/shelf.py" "$DEST/update.sh" "$DEST/bazzpi-shelf"
sudo chown -R "$USER_NAME" "$DEST"
if [ ! -s "$DEST/outfit.ttf" ]; then
  sudo curl -fsSL "https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/Outfit%5Bwght%5D.ttf" -o "$DEST/outfit.ttf" || true
  sudo chown "$USER_NAME" "$DEST/outfit.ttf" || true
fi

sudo tee /usr/local/bin/bazzpi-shelf >/dev/null << 'EOF'
#!/bin/bash
exec /opt/bazzpi-shelf/bazzpi-shelf
EOF
sudo chmod 755 /usr/local/bin/bazzpi-shelf

sudo tee /etc/sudoers.d/bazzpi-shelf >/dev/null << EOF
$USER_NAME ALL=(root) NOPASSWD: /usr/bin/systemctl reboot, /usr/bin/systemctl poweroff, /usr/bin/hostnamectl, /usr/bin/raspi-config, /usr/bin/timedatectl
EOF
sudo chmod 440 /etc/sudoers.d/bazzpi-shelf

sudo usermod -aG video,render,input,audio,netdev "$USER_NAME" || true
getent group seat >/dev/null && sudo usermod -aG seat "$USER_NAME" || true
getent group _seatd >/dev/null && sudo usermod -aG _seatd "$USER_NAME" || true
sudo systemctl enable seatd

for cfg in /boot/firmware/config.txt /boot/config.txt; do
  if [ -f "$cfg" ] && ! grep -q '^gpu_mem=' "$cfg"; then
    echo 'gpu_mem=128' | sudo tee -a "$cfg" >/dev/null
  fi
done

if command -v raspi-config >/dev/null 2>&1; then
  sudo raspi-config nonint do_boot_behaviour B2 || true
else
  sudo mkdir -p /etc/systemd/system/getty@tty1.service.d
  sudo tee /etc/systemd/system/getty@tty1.service.d/autologin.conf >/dev/null << EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin ${USER_NAME} --noclear %I \$TERM
EOF
fi

if [ ! -f "$HOME_DIR/.bash_profile" ]; then
  printf '%s\n' '[ -f "$HOME/.profile" ] && . "$HOME/.profile"' > "$HOME_DIR/.bash_profile"
fi
if ! grep -q 'exec labwc' "$HOME_DIR/.bash_profile"; then
  cat >> "$HOME_DIR/.bash_profile" << 'EOF'

# Local screen only. SSH stays a normal terminal.
if [ -z "${WAYLAND_DISPLAY:-}" ] && [ "$(tty)" = "/dev/tty1" ]; then
  exec labwc
fi
EOF
fi

mkdir -p "$HOME_DIR/.config/labwc" "$HOME_DIR/ROMs"
for dir in nes snes gb gbc gba mastersystem megadrive gamegear segacd pcengine neogeo fbneo psx n64 dreamcast psp nds; do
  mkdir -p "$HOME_DIR/ROMs/$dir"
done
printf '%s\n' '/usr/local/bin/bazzpi-shelf &' > "$HOME_DIR/.config/labwc/autostart"
if [ ! -f "$HOME_DIR/.config/labwc/rc.xml" ]; then
  cat > "$HOME_DIR/.config/labwc/rc.xml" << 'EOF'
<?xml version="1.0"?>
<openbox_config xmlns="http://openbox.org/3.4/rc">
  <keyboard>
    <keybind key="C-A-t">
      <action name="Execute"><command>foot</command></action>
    </keybind>
  </keyboard>
</openbox_config>
EOF
fi

echo "Reboot. The Pi logs in by itself and opens the shelf. The first screen is still the profile."
