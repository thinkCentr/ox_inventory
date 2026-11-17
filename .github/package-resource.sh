#!/usr/bin/env bash
set -euo pipefail
root=$(pwd)
stage=$(mktemp -d)
trap 'rm -rf -- "$stage"' EXIT
dest="$stage/ox_inventory"

test -s web/build/index.html
test -n "$(find web/build/assets -name '*.js' -type f -size +0c -print -quit)"
test -n "$(find web/build/assets -name '*.css' -type f -size +0c -print -quit)"

mkdir -p "$dest/web"
cp fxmanifest.lua init.lua server.lua client.lua README.md LICENSE "$dest/"
cp -r modules data locales "$dest/"
cp -r web/build web/images web/LICENSE "$dest/web/"
(
  cd "$stage"
  zip -qr ox_inventory.zip ox_inventory
  unzip -tq ox_inventory.zip
)
mv -f "$stage/ox_inventory.zip" "$root/ox_inventory.zip"
