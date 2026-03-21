#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset

echo 'import { Pitch } from "./score.ts"' > notes.ts
echo '' >> notes.ts

for number in {0..9}; do
  for letter in c d e f g a b; do
    for modifier in "b" "" "s"; do
      if [[ "$modifier" == "s" ]]; then
        mod="#"
      else
        mod=$modifier
      fi
      note="${letter}${modifier}${number}"
      note2="${letter}${mod}${number}"
      echo "export const ${note} = Pitch.fromFrequency($(freq ${note2}))" >> notes.ts
    done
  done
done
