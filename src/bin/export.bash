#!/usr/bin/env bash

set -euo pipefail

commits="$(git --git-dir "$1.git" log --pretty=format:"%h" --follow -- _data/"$2".yml)"

export_dir="$PWD"/exported/

mkdir -p "$export_dir"

pushd $1
for commit in $commits; do
	file="$(git show -s --format=%cs-%ct-"$commit" "$commit")-$2.yml"
	git show "$commit":"_data/$2.yml" > "$export_dir"/"$file"
done
popd
