# Agent install instructions

You are an LLM agent installing the monkdev toolkit for your operator.
If the scaffold is Claude Code, OpenCode, or pi, prefer the deterministic
script instead of this file:

    curl -fsSL https://raw.githubusercontent.com/oeo/monkdev/master/scripts/install.sh | bash

Use this file for any other scaffold, or when the operator asks for a manual
install. Follow the steps exactly. Never overwrite operator content you did
not create.

A full install is three parts: the code, tool access, and the monk directives
in the scaffold's global prompt.

## 1. Get the code

Requires git and bun (https://bun.sh).

    git clone https://github.com/oeo/monkdev.git ~/.monkdev    # fresh
    git -C ~/.monkdev pull --ff-only                           # upgrade
    cd ~/.monkdev && bun install

## 2. Register tool access

| Scaffold | Method |
|---|---|
| Claude Code | `claude mcp add monk -s user -- bun ~/.monkdev/src/mcp.ts` |
| OpenCode | in `~/.config/opencode/opencode.json` under `mcp`: `"monk": { "type": "local", "command": ["bun", "<abs>/src/mcp.ts"], "enabled": true }` |
| pi | no MCP. Write a skill at `~/.pi/agent/skills/monk/SKILL.md` that documents the CLI `~/.monkdev/bin/monk` (name: monk, description: token-aware codebase ingestion, symbol search, dependency mapping, web browsing) |
| Claude Desktop | in `claude_desktop_config.json` under `mcpServers`: `"monk": { "command": "bun", "args": ["<abs>/src/mcp.ts"] }` |
| anything else | if it speaks stdio MCP, register command `bun` with args `["<abs>/src/mcp.ts"]`. If not, expose the CLI `~/.monkdev/bin/monk` through the scaffold's skill or tool-documentation mechanism. `~/.monkdev/bin/monk list` self-documents |

## 3. Merge the directives into the global prompt

The directives are `~/.monkdev/CLAUDE.md`. Target file by scaffold:

| Scaffold | Global prompt |
|---|---|
| Claude Code | `~/.claude/CLAUDE.md` |
| OpenCode | `~/.config/opencode/AGENTS.md` |
| pi | `~/.pi/agent/AGENTS.md` |
| anything else | the scaffold's global or user-level context file, usually `AGENTS.md` |

Merge contract, exact and idempotent:

- Markers: `<!-- BEGIN MONK DIRECTIVES -->` and `<!-- END MONK DIRECTIVES -->`.
- Target missing: create it as BEGIN, contents of CLAUDE.md, END.
- Both markers present: replace only the lines between them. Every byte
  outside the markers stays identical.
- BEGIN present but END missing: stop. Tell the operator to restore the END
  marker. Never guess where the block ends.
- No markers: append a blank line, BEGIN, contents, END.

## 4. Verify

- Restart the agent session.
- MCP scaffolds: the `monk_tree` tool responds.
- CLI scaffolds: `~/.monkdev/bin/monk tree` prints the ranked file map.
- Optional: brave-search needs `BRAVE_API_KEY` in `~/.monkdev/.env`
  (copy `.env.example`).
- fetch-url and screenshot-url use the installed Google Chrome or Chromium,
  auto-detected. Set `MONK_CHROME` to override. Nothing is downloaded.
