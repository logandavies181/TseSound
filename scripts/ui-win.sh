#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset

rm -rf dist
mkdir dist

tailwindcss build ui -o ui/output.css
deno bundle ui/app.ts -o ui/app.js
deno bundle --unstable-raw-imports ui/ui.ts -o dist/ui.js

cd dist

deno compile \
  -A \
  --target x86_64-pc-windows-msvc \
  ui.js
