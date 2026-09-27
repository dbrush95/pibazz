#!/bin/bash
# Run as the Pi user: bash tools/moonlight-diagnostics.sh 192.168.1.20
# Reads system state and probes the specified LAN host. Does not change settings.
set -uo pipefail
PC_IP="${1:-}"
if [ -z "$PC_IP" ]; then echo 'Usage: bash moonlight-diagnostics.sh <PC LAN IPv4 address or hostname>'; exit 1; fi
REPORT="$HOME/moonlight-diagnostics.txt"
{
  echo 'Bazzpi / Moonlight diagnostic report'
  date -Is
  uname -a
  cat /etc/os-release
  printf '\nMoonlight packages\n'
  dpkg-query -W moonlight-qt 'libavcodec*' 2>/dev/null || true
  printf '\nDesktop session\n'
  printf 'WAYLAND_DISPLAY=%s\nDISPLAY=%s\nXDG_SESSION_TYPE=%s\n' "${WAYLAND_DISPLAY:-}" "${DISPLAY:-}" "${XDG_SESSION_TYPE:-}"
  id
  printf '\nVideo devices\n'
  ls -l /dev/dri /dev/video* 2>/dev/null || true
  printf '\nBoot display configuration\n'
  for cfg in /boot/firmware/config.txt /boot/config.txt; do
    [ ! -f "$cfg" ] || grep -E '^\[|^gpu_mem|^dtoverlay=.*(vc4|rpivid)|^hdmi_' "$cfg" || true
  done
  printf '\nAudio\n'
  systemctl --user is-active pipewire pipewire-pulse wireplumber 2>/dev/null || true
  if command -v wpctl >/dev/null; then wpctl status; fi
  printf '\nLAN TCP checks (not a UDP streaming test)\n'
  python3 - "$PC_IP" <<'PY'
import socket,sys
host=sys.argv[1]
for port in (47989,47984,48010,47990):
    try:
        with socket.create_connection((host,port),timeout=2): print(f'{host}:{port} TCP reachable')
    except OSError as exc: print(f'{host}:{port} TCP failed: {exc}')
print('Sunshine UDP 47998-48000 is not tested here. No internet port forwarding is needed.')
PY
  printf '\nLast shelf-launched app output\n'
  tail -n 100 "$HOME/.local/state/bazzpi/last-app.log" 2>/dev/null || true
} > "$REPORT" 2>&1
printf 'Saved %s\n' "$REPORT"
