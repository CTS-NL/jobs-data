#!/usr/bin/env bash

set -euo pipefail

export_dir="$PWD"/exported/

mkdir -p "$export_dir"

pushd "$1"
file="$(git show -s --format=%cs-%ct-%h)-$2.yml"
echo $file
git show :"_data/$2.yml" > "$export_dir"/"$file"

popd

./src/bin/cts.js "$2" "$export_dir"/"$file" "$3"
