#!/usr/bin/env bash
# Monkdev installer/upgrader.
#   curl -fsSL https://raw.githubusercontent.com/oeo/monkdev/master/scripts/install.sh | bash
# Env overrides: MONK_DIR (install dir), MONK_GLOBAL_PROMPT (global prompt path).
set -euo pipefail

REPO="https://github.com/oeo/monkdev.git"
DIR="${MONK_DIR:-$HOME/.monkdev}"
BEGIN="<!-- BEGIN MONK DIRECTIVES -->"
END="<!-- END MONK DIRECTIVES -->"

command -v git >/dev/null || { echo "git is required." >&2; exit 1; }
command -v bun >/dev/null || { echo "bun is required — install from https://bun.sh" >&2; exit 1; }

# Detect agent platform
IS_OPENCODE=0
if [ -f "$HOME/.config/opencode/opencode.json" ]; then
  IS_OPENCODE=1
fi
IS_PI=0
if [ -d "$HOME/.pi/agent" ] || command -v pi >/dev/null; then
  IS_PI=1
fi

# Global prompt targets: the explicit override, or every detected platform.
# Platforms may coexist; every detected one must receive the directives.
if [ -n "${MONK_GLOBAL_PROMPT:-}" ]; then
  GLOBALS=("$MONK_GLOBAL_PROMPT")
else
  GLOBALS=("$HOME/.claude/CLAUDE.md")
  [ "$IS_OPENCODE" -eq 1 ] && GLOBALS+=("$HOME/.config/opencode/AGENTS.md")
  [ "$IS_PI" -eq 1 ] && GLOBALS+=("$HOME/.pi/agent/AGENTS.md")
fi

if [ -d "$DIR/.git" ]; then
  echo "Updating monkdev at $DIR"
  git -C "$DIR" pull --ff-only || {
    echo "error: $DIR has diverged from origin and cannot fast-forward." >&2
    echo "Resolve manually: cd $DIR && git status" >&2
    exit 1
  }
else
  echo "Cloning monkdev to $DIR"
  git clone "$REPO" "$DIR"
fi

(cd "$DIR" && bun install)

# Register tools. Platforms may coexist; handle every detected one.
REGISTERED=0
if command -v claude >/dev/null; then
  claude mcp remove monk -s user >/dev/null 2>&1 || true
  claude mcp add monk -s user -- bun "$DIR/src/mcp.ts"
  echo "Registered MCP server 'monk' with Claude Code."
  REGISTERED=1
fi
if [ "$IS_OPENCODE" -eq 1 ]; then
  cat <<EOF
OpenCode detected. Add/edit the MCP server in ~/.config/opencode/opencode.json:
  "monk": { "type": "local", "command": ["bun", "$DIR/src/mcp.ts"], "enabled": true }
EOF
  REGISTERED=1
fi
if [ "$IS_PI" -eq 1 ]; then
  # pi has no MCP; expose the toolkit as a CLI skill instead.
  mkdir -p "$HOME/.pi/agent/skills/monk"
  cat > "$HOME/.pi/agent/skills/monk/SKILL.md" <<EOF
---
name: monk
description: Token-aware codebase ingestion, symbol search, dependency mapping, and web browsing via the monk CLI. Use for mapping architecture, packing directories, batch file reads, outlines, dependency graphs, symbol definitions, web search, and page fetch or screenshot.
---

Run monk as a CLI (requires bun):

    $DIR/bin/monk list             # all tools
    $DIR/bin/monk describe <tool>  # a tool's args
    $DIR/bin/monk tree [path]      # map architecture by importance
    $DIR/bin/monk context <dir>    # pack a directory into XML
    $DIR/bin/monk catfiles <files> # batch-read files with headers
    $DIR/bin/monk outline <files>  # structural signatures only
    $DIR/bin/monk deps             # dependency graph
    $DIR/bin/monk symbol <name>    # find symbol definitions
    $DIR/bin/monk brave-search <q> # web search (needs BRAVE_API_KEY in $DIR/.env)
    $DIR/bin/monk fetch-url <url>  # render and extract a page
    $DIR/bin/monk screenshot-url <url> --out <file>

Prefer catfiles over cat or head for code, fetch-url over curl for pages.
EOF
  echo "Wrote pi skill to ~/.pi/agent/skills/monk/SKILL.md (pi has no MCP; monk runs as CLI)."
  REGISTERED=1
fi
if [ "$REGISTERED" -eq 0 ]; then
  cat <<EOF
Add the MCP server to your agent config manually:
  "monk": { "command": "bun", "args": ["$DIR/src/mcp.ts"] }
EOF
fi

# Merge the monk directives into each global prompt between markers, never
# touching operator content outside them.
merge_directives() {
  local target="$1"
  mkdir -p "$(dirname "$target")"
  if [ ! -f "$target" ]; then
    { echo "$BEGIN"; cat "$DIR/CLAUDE.md"; echo "$END"; } > "$target"
    echo "Created $target with monk directives."
  elif grep -qF "$BEGIN" "$target"; then
    if ! grep -qF "$END" "$target"; then
      echo "error: $target has the BEGIN marker but no END marker." >&2
      echo "Upgrading would delete everything after BEGIN. Restore the END marker first:" >&2
      echo "  $END" >&2
      exit 1
    fi
    awk -v dir="$DIR" -v begin="$BEGIN" -v end="$END" '
      $0 == begin { print; while ((getline line < (dir "/CLAUDE.md")) > 0) print line; skip = 1; next }
      $0 == end { skip = 0 }
      !skip { print }
    ' "$target" > "$target.tmp"
    mv "$target.tmp" "$target"
    echo "Upgraded monk directives in $target."
  else
    { echo ""; echo "$BEGIN"; cat "$DIR/CLAUDE.md"; echo "$END"; } >> "$target"
    echo "Appended monk directives to $target."
  fi
}

for g in "${GLOBALS[@]}"; do merge_directives "$g"; done

cat <<EOF

Done. Restart your agent session, then verify the monk_tree tool responds
(pi: run $DIR/bin/monk tree instead).
Optional: brave-search needs BRAVE_API_KEY in $DIR/.env (copy .env.example).
Note: fetch-url / screenshot-url use your installed Google Chrome or Chromium
(auto-detected; set MONK_CHROME to override). Nothing is downloaded.
EOF