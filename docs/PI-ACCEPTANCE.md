# Before deploying to the family

Automated tests are necessary but do not exercise real Pi GPU/audio/input devices.
Use one Pi 4 and the actual Bazzite host for this acceptance pass:

- Fresh Lite install → reboot → create profile → PIN lock/unlock → second reboot.
- TV output at 1080p; use HDMI nearest the Pi power connector; select correct audio sink.
- Connect by IPv4; run TCP check; pair with on-shelf PIN; refresh actual app names.
- Stream Desktop and Steam for at least 15 minutes each. Check hardware decoder, FPS,
  dropped frames, input delay, audio, and controller operation in Moonlight statistics.
- Quit stream and confirm shelf returns. Wrong host, unavailable app, stopped Sunshine,
  and forced unavailable decoder should show useful errors without losing the desktop.
- Open Chromium, sign in, open a second window, test Super+H / Alt+Tab, close all windows,
  reopen and confirm sign-in persists. Repeat with RetroArch and terminal.
- Test controller navigation on shelf and ensure stream input does not operate the shelf.
- Change theme/wallpaper, reboot and confirm persistence. Native decorations currently stay light.
- Reboot with WAN/internet disconnected but LAN alive: shelf and local streaming must work.
- On an evaluation card, verify update status, retained previous release and manual rollback.
- Pair a second Pi independently. Confirm the family understands that one Sunshine host session
  is shared, not separate simultaneous PCs.

Record Pi OS version, Moonlight version, Pi model, TV mode, Ethernet/Wi-Fi, and both client/host
error logs when a failure happens. That evidence identifies network vs capture vs decoding issues.
