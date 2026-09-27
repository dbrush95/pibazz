#!/bin/bash
# Download the shelf from GitHub and replace the local copy when it changed.
BASE="https://raw.githubusercontent.com/dbrush95/pibazz/main/shelf"
DEST=/opt/bazzpi-shelf
STATUS=/tmp/bazzpi-update-status
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

files="index.html shelf.css shelf.js shelf.py update.sh bazzpi-shelf"
for file in $files; do
  if ! curl -fsSL --retry 1 --max-time 25 "$BASE/$file" -o "$STAGE/$file"; then
    echo "offline" > "$STATUS"
    exit 0
  fi
done

changed=0
for file in $files; do
  if [ ! -f "$DEST/$file" ] || ! cmp -s "$STAGE/$file" "$DEST/$file"; then
    changed=1
  fi
done

if [ "$changed" -eq 0 ]; then
  echo "current" > "$STATUS"
  exit 0
fi

cp "$STAGE/index.html" "$STAGE/shelf.css" "$STAGE/shelf.js" "$STAGE/shelf.py" "$STAGE/update.sh" "$STAGE/bazzpi-shelf" "$DEST/"
chmod 755 "$DEST/shelf.py" "$DEST/update.sh" "$DEST/bazzpi-shelf"
echo "updated" > "$STATUS"
