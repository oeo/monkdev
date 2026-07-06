#!/usr/bin/env bash
# Monkdev installer/upgrader.
#   curl -fsSL https://raw.githubusercontent.com/oeo/monkdev/master/scripts/install.sh | bash
# Env overrides: MONK_DIR (install dir), MONK_GLOBAL_PROMPT (global CLAUDE.md path).
set -euo pipefail

REPO="https://github.com/oeo/monkdev.git"
DIR="${MONK_DIR:-$HOME/.monkdev}"
GLOBAL="${MONK_GLOBAL_PROMPT:-$HOME/.claude/CLAUDE.md}"
BEGIN="<!-- BEGIN MONK DIRECTIVES -->"
END="<!-- END MONK DIRECTIVES -->"

command -v git >/dev/null || { echo "git is required." >&2; exit 1; }
command -v bun >/dev/null || { echo "bun is required — install from https://bun.sh" >&2; exit 1; }

if [ -d "$DIR/.git" ]; then
  echo "Updating monkdev at $DIR"
  git -C "$DIR" pull --ff-only
else
  echo "Cloning monkdev to $DIR"
  git clone "$REPO" "$DIR"
fi

(cd "$DIR" && bun install)

if command -v claude >/dev/null; then
  claude mcp remove monk -s user >/dev/null 2>&1 || true
  claude mcp add monk -s user -- bun "$DIR/src/mcp.ts"
  echo "Registered MCP server 'monk' with Claude Code."
else
  cat <<EOF
Claude CLI not found. Add the MCP server to your agent config manually:
  "monk": { "type": "local", "command": ["bun", "$DIR/src/mcp.ts"], "timeout": 60000 }
EOF
fi

# Merge the monk directives into the global prompt between markers, never
# touching operator content outside them.
mkdir -p "$(dirname "$GLOBAL")"
if [ ! -f "$GLOBAL" ]; then
  { echo "$BEGIN"; cat "$DIR/CLAUDE.md"; echo "$END"; } > "$GLOBAL"
  echo "Created $GLOBAL with monk directives."
elif grep -qF "$BEGIN" "$GLOBAL"; then
  awk -v dir="$DIR" -v begin="$BEGIN" -v end="$END" '
    $0 == begin { print; while ((getline line < (dir "/CLAUDE.md")) > 0) print line; skip = 1; next }
    $0 == end { skip = 0 }
    !skip { print }
  ' "$GLOBAL" > "$GLOBAL.tmp"
  mv "$GLOBAL.tmp" "$GLOBAL"
  echo "Upgraded monk directives in $GLOBAL."
else
  { echo ""; echo "$BEGIN"; cat "$DIR/CLAUDE.md"; echo "$END"; } >> "$GLOBAL"
  echo "Appended monk directives to $GLOBAL."
fi

cat <<EOF

Done. Restart your agent session, then verify the monk_tree tool responds.
Optional: brave-search needs BRAVE_API_KEY in $DIR/.env (copy .env.example).
Note: the first fetch-url / screenshot-url call downloads a headless Chromium (~200MB).
EOF
