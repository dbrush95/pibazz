#!/bin/bash
# Fetch one immutable commit. Never execute an installer or apt at boot.
set -Eeuo pipefail
DEST="${BAZZPI_DEST:-/opt/bazzpi-shelf}"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/bazzpi"
mkdir -p "$STATE" "$DEST/releases"
STATUS="$STATE/update-status"
exec 9>"$STATE/update.lock"
flock -n 9 || exit 0
[ ! -f "$HOME/.config/bazzpi/updates-disabled" ] || { echo disabled > "$STATUS"; exit 0; }
echo checking > "$STATUS"
STAGE=$(mktemp -d "$DEST/releases/.stage-XXXXXX")
trap 'rm -rf "$STAGE"' EXIT
trap 'echo failed > "$STATUS"' ERR
REF="${BAZZPI_UPDATE_REF:-main}"
[[ "$REF" =~ ^[A-Za-z0-9._/-]+$ ]] || exit 1
# Whole operation is bounded by the caller; failed network leaves current intact.
if ! curl -fsSL --connect-timeout 3 --max-time 8 "https://api.github.com/repos/dbrush95/pibazz/commits/$REF" -o "$STAGE/commit.json"; then
  echo offline > "$STATUS"; exit 0
fi
SHA=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["sha"])' "$STAGE/commit.json")
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || exit 1
if [ -f "$DEST/current/revision" ] && [ "$(cat "$DEST/current/revision")" = "$SHA" ]; then
  echo current > "$STATUS"; exit 0
fi
if [ -f "$STATE/rejected-revision" ] && [ "$(cat "$STATE/rejected-revision")" = "$SHA" ]; then
  echo rollback > "$STATUS"; exit 0
fi
# After one raw-host failure, use the API for the rest of this update.
# The API serves file bytes directly with this Accept header (no raw-host redirect).
USE_API=0
fetch_file() {
  local file="$1"
  if [ "$USE_API" = 0 ]; then
    if curl -fsSL --connect-timeout 3 --max-time 8 "https://raw.githubusercontent.com/dbrush95/pibazz/$SHA/shelf/$file" -o "$STAGE/$file"; then
      return 0
    fi
    echo "Raw download failed; trying GitHub Contents API with TLS verification."
    USE_API=1
  fi
  curl -fsSL --connect-timeout 3 --max-time 8 \
    -H 'Accept: application/vnd.github.raw+json' \
    "https://api.github.com/repos/dbrush95/pibazz/contents/shelf/$file?ref=$SHA" -o "$STAGE/$file"
}
FILES=(index.html shelf.css shelf.js shelf.py update.sh bazzpi-shelf)
for file in "${FILES[@]}"; do
  fetch_file "$file"
  test -s "$STAGE/$file"
done
python3 -m py_compile "$STAGE/shelf.py"
bash -n "$STAGE/update.sh" "$STAGE/bazzpi-shelf"
# Node is installed by the Lite installer; require it before activating updates.
node --check "$STAGE/shelf.js"
grep -q 'id="desk"' "$STAGE/index.html"
[ ! -f "$DEST/current/outfit.ttf" ] || cp "$DEST/current/outfit.ttf" "$STAGE/"
printf '%s\n' "$SHA" > "$STAGE/revision"
chmod 755 "$STAGE/bazzpi-shelf" "$STAGE/update.sh"
rm -f "$STAGE/commit.json"
if [ ! -d "$DEST/releases/$SHA" ]; then mv "$STAGE" "$DEST/releases/$SHA"; fi
OLD=$(readlink -f "$DEST/current")
ln -sfn "$OLD" "$DEST/previous.new"
mv -Tf "$DEST/previous.new" "$DEST/previous"
ln -sfn "$DEST/releases/$SHA" "$DEST/current.new"
mv -Tf "$DEST/current.new" "$DEST/current"
echo updated > "$STATUS"
