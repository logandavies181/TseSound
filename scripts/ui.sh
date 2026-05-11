#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset

rm -rf dist
mkdir dist

cp ui/index.html dist
deno bundle ui/app.ts -o dist/app.js
deno bundle ui/ui.ts -o dist/ui.js
tailwindcss build dist -o dist/output.css

cd dist && deno -A ui.js
