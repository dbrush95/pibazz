#!/bin/bash
# Puts the Bazzpi shelf on a running Raspberry Pi OS desktop.
set -euo pipefail
BASE="https://raw.githubusercontent.com/dbrush95/pibazz/main/shelf"
DEST=/opt/bazzpi-shelf
USER_NAME="${SUDO_USER:-$(id -un)}"
HOME_DIR="$(getent passwd "$USER_NAME" | cut -d: -f6)"

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this as the desktop user, not root: bash install.sh"
  exit 1
fi

sudo mkdir -p "$DEST"
for file in index.html shelf.css shelf.js shelf.py; do
  sudo curl -fsSL "$BASE/$file" -o "$DEST/$file"
done
sudo chmod 755 "$DEST/shelf.py"
if [ ! -s "$DEST/outfit.ttf" ]; then
  sudo curl -fsSL "https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/Outfit%5Bwght%5D.ttf" -o "$DEST/outfit.ttf" || true
fi

if ! command -v chromium >/dev/null 2>&1 && ! command -v chromium-browser >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y chromium || sudo apt-get install -y chromium-browser
fi

sudo tee /usr/local/bin/bazzpi-shelf >/dev/null << 'EOF'
#!/bin/bash
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-0}"
export DISPLAY="${DISPLAY:-:0}"
if ! curl -sf http://127.0.0.1:8765/api/status >/dev/null; then
  python3 /opt/bazzpi-shelf/shelf.py >>/tmp/bazzpi-shelf.log 2>&1 &
fi
for _ in $(seq 1 50); do
  curl -sf http://127.0.0.1:8765/api/status >/dev/null && break
  sleep 0.1
done
if command -v chromium >/dev/null 2>&1; then
  CHROME=chromium
else
  CHROME=chromium-browser
fi
"$CHROME" --kiosk --ozone-platform=wayland --noerrdialogs --disable-session-crashed-bubble --disable-infobars --check-for-update-interval=31536000 --app=http://127.0.0.1:8765/ || \
"$CHROME" --kiosk --noerrdialogs --disable-session-crashed-bubble --disable-infobars --app=http://127.0.0.1:8765/
EOF
sudo chmod 755 /usr/local/bin/bazzpi-shelf

sudo tee /etc/sudoers.d/bazzpi-shelf >/dev/null << EOF
$USER_NAME ALL=(root) NOPASSWD: /usr/bin/systemctl reboot, /usr/bin/systemctl poweroff, /usr/bin/hostnamectl, /usr/bin/raspi-config, /usr/bin/timedatectl
EOF
sudo chmod 440 /etc/sudoers.d/bazzpi-shelf

mkdir -p "$HOME_DIR/.config/labwc" "$HOME_DIR/.config/autostart"
AUTO="$HOME_DIR/.config/labwc/autostart"
if [ ! -s "$AUTO" ] && [ -f /etc/xdg/labwc/autostart ]; then
  cp /etc/xdg/labwc/autostart "$AUTO"
fi
touch "$AUTO"
sed -i '/moonlight/d' "$AUTO"
grep -q 'bazzpi-shelf' "$AUTO" || printf '\n/usr/local/bin/bazzpi-shelf &\n' >> "$AUTO"
rm -f "$HOME_DIR/.config/autostart/bazzpi-moonlight.desktop"
sudo rm -f /etc/xdg/autostart/bazzpi-moonlight.desktop
pkill -f moonlight-qt || true

echo "Shelf installed. Log out and back in, or reboot. The shelf replaces the plain desktop."
