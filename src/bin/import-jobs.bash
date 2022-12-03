#!/usr/bin/env bash

set -euo pipefail

company_files="$(echo exported/*-jobs.yml)"

for f in $company_files; do
	./src/bin/cts.js jobs "$f" ./database.db
done
