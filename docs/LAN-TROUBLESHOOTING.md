# LAN streaming: find which step fails

Use Play → Test connection from the Pi. Use the PC's normal LAN address, not `localhost`,
a Docker/container address, a public address, or Sunshine's web port appended to the host.
The built-in probe assumes Sunshine's default ports and IPv4/hostname input.

| Result | What to check next |
| --- | --- |
| Discovery TCP 47989 fails | Correct PC address; Sunshine running; PC awake; same LAN; guest Wi-Fi/client isolation; host firewall/service binding. |
| Pairing TCP 47984 fails | Sunshine service and host firewall. Opening its web page on 47990 is not sufficient. |
| Stream setup TCP 48010 fails | Sunshine's RTSP port/service. Pairing alone does not verify this step. |
| Web settings TCP 47990 fails, others pass | Pair using `https://localhost:47990` on the PC. The admin UI may be limited to localhost. |
| All required TCP checks pass, pairing fails | Read the pairing error. Pair this Pi again; enter the PIN before the two-minute timeout. |
| Pairing works, stream fails | Read the persistent launch error and `~/.local/state/bazzpi/last-app.log`. Check Sunshine's host logs at the same time. |
| No video / UDP error | Sunshine uses UDP 47998–48000 by default. Check host firewall, Wi-Fi isolation, VLAN rules, and packet loss. The TCP test does not test these UDP paths. |
| Decoder unavailable / codec error | Automatic decoder first; verify Pi-specific Moonlight package and current Pi OS packages. Hardware-only can prevent launch when the selected decoder is unavailable. |
| Black captured picture | Verify Sunshine can capture the current Bazzite display/session; test Desktop from another Moonlight client; a headless host may need a configured display. |
| Stutter | Ethernet first, Pi TV output 1080p, try 720p60 / 10 Mb/s. Examine decode time, dropped frames, and network latency in Moonlight statistics. |
| No HDMI audio | Verify PipeWire/WirePlumber services and selected output using `wpctl status`; reboot after installing Lite dependencies. |

Logs on the Pi:

```bash
cat ~/.local/state/bazzpi/last-app.log
cat ~/.local/state/bazzpi/shelf.log
cat ~/.local/state/bazzpi/update-status
systemctl --user status pipewire pipewire-pulse wireplumber --no-pager
wpctl status
```

This client does not open router ports, turn on UPnP, or change the Bazzite firewall. Restrict any
necessary host firewall allowances to your home network. Router port forwarding is unnecessary.

Upstream references:
- https://github.com/moonlight-stream/moonlight-docs/wiki/Installing-Moonlight-Qt-on-Raspberry-Pi-4
- https://github.com/moonlight-stream/moonlight-qt/tree/master/app/cli
- https://docs.lizardbyte.dev/projects/sunshine/latest/md_docs_2configuration.html

## “No video received from host — UDP 47998, UDP 48000”

Moonlight displays this text for `ML_ERROR_NO_VIDEO_TRAFFIC`. It is not proof that a
firewall rule is missing. The exact cause still needs the host and client logs.

1. In Play, expand **No video / firewall error?** and try the **compatibility stream**.
   It uses 720p30, H.264, 5 Mb/s, stereo, HDR off, and 1024-byte video packets for that
   attempt only. If it works, that narrows the problem but does not prove MTU was the cause,
   because bitrate and other variables changed too.
2. Try the same host using Moonlight on another device on the same home LAN. If both fail,
   focus on Sunshine capture/encoding and the host/network path. If only the Pi fails,
   compare the Pi's network path, software versions and client logs.
3. On Bazzite, open Sunshine's Troubleshooting page and inspect/download the log immediately
   after the failed launch. Check display capture/encoder startup errors. Record `uname -r`.
4. Check whether both devices are on the same ordinary LAN, not an isolated guest SSID.
   Use the host's LAN IPv4 address. Test Ethernet if possible.
5. If packets still do not arrive and the host is on an affected Linux 7.0 kernel/driver,
   a documented UDP segmentation-offload regression is a possible cause. This is conditional,
   not a diagnosis of your Bazzite machine. See the upstream issue below before changing NIC
   offload settings. No host network settings are changed by Bazzpi.

References:
- https://github.com/moonlight-stream/moonlight-qt/blob/master/app/streaming/session.cpp
- https://github.com/LizardByte/Sunshine/issues/5067
- https://docs.lizardbyte.dev/projects/sunshine/latest/md_docs_2troubleshooting.html
