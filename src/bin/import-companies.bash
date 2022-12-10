#!/usr/bin/env bash

set -euo pipefail

company_files="$(echo exported/*-companies.yml)"

for f in $company_files; do
	./src/bin/cts.js companies "$f" $1
	echo
done
