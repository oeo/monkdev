#!/usr/bin/env bash
# Evaluation corpus: five implementations of the same Conduit API spec, in four
# languages. Same facts restated across syntaxes, with a published spec as
# ground truth. Pinned by SHA so tree/canon/deps counts stay deterministic.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)/corpus"
mkdir -p "$DIR"

while IFS='|' read -r name url sha; do
  [ -z "$name" ] && continue
  target="$DIR/$name"
  if [ -d "$target/.git" ] && [ "$(git -C "$target" rev-parse HEAD 2>/dev/null)" = "$sha" ]; then
    echo "ok       $name"
    continue
  fi
  rm -rf "$target"
  git init -q "$target"
  git -C "$target" remote add origin "$url"
  # fetch the pinned commit alone; a branch clone would drift on every upstream push
  git -C "$target" fetch -q --depth 1 origin "$sha"
  git -C "$target" checkout -q FETCH_HEAD
  echo "fetched  $name  $(du -sh "$target" | cut -f1)"
done <<'REPOS'
spec|https://github.com/realworld-apps/realworld|98f29fb3f8bcb1dd614b91f2851371bf22c34775
python-django|https://github.com/c4ffein/realworld-django-ninja|04ef47ced437ee8795a13bdcbc2eff2be19e33bd
ts-nitro|https://github.com/realworld-apps/nitro-prisma-zod-realworld-example-app|c8c66858a436a6e07f445fffe2253a65ff6dcb58
rust-axum|https://github.com/launchbadge/realworld-axum-sqlx|f1b25654773228297e35c292f357d33b7121a101
go-gin|https://github.com/gothinkster/golang-gin-realworld-example-app|626c372d259472148d93303f74aa9b9a1cdcef24
REPOS

echo
du -sh "$DIR"
