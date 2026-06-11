# Installing monk (agent runbook)

You are an AI agent (Claude Code, OpenCode, or similar) installing or upgrading
the monk toolkit for your operator. Read this whole file, then carry it out
adapting to **your** environment — you know your own config layout better than any
script could. A full install is two parts: register the **MCP server** (the
tools) and install the **monk directives** (the behavior). Never overwrite the
operator's files without asking.

## 1. Get the code

- Already inside the `monkdev` repo? Skip to deps.
- Fresh install: `git clone https://github.com/oeo/monkdev.git && cd monkdev`
- Upgrade: `git pull` in the existing checkout.
- Install dependencies: `bun install`. (Bun is required — https://bun.sh.)

## 2. Register the MCP server

The entrypoint is `src/mcp.ts`, launched with `bun`. Use an **absolute path** and
a generous timeout (~60s) for the Chromium cold-start.

- Claude Code: `claude mcp add monk -s user -- bun "$(pwd)/src/mcp.ts"`
- OpenCode / Claude Desktop — add to your MCP config:
  ```json
  "monk": { "type": "local", "command": ["bun", "<abs>/src/mcp.ts"], "timeout": 60000 }
  ```

## 3. Install the monk directives (the persona)

The directives are this repo's [`CLAUDE.md`](CLAUDE.md). They must live in your
operator's **global** system prompt so the discipline applies everywhere, not
just this project:

- Claude Code: `~/.claude/CLAUDE.md`
- OpenCode: your global instructions file (e.g. `~/.config/opencode/AGENTS.md`).

Wrap the inserted directives in markers so upgrades replace cleanly instead of
duplicating:

```
<!-- BEGIN MONK DIRECTIVES -->
...contents of CLAUDE.md...
<!-- END MONK DIRECTIVES -->
```

Decide what to do based on the current state of that global file:

- **No global file** → create it with the marked block.
- **File exists, no monk markers** → this is a first install over existing
  instructions. **Ask the operator**: replace the whole file, or append the
  marked block? Do not choose for them.
- **Markers already present** → this is an upgrade. Replace only the content
  between the markers. No prompt needed.

## 4. Configure & verify

- Optional: `brave-search` needs `BRAVE_API_KEY` in `.env` (copy `.env.example`).
  Every other tool works without a key.
- The first `screenshot-url` / `fetch-url` call downloads a headless Chromium
  (~200MB) via CloakBrowser — expect a slow first invocation.
- Restart the agent session so the MCP server and the directives both load.
- Verify: the `monk_tree` tool responds, and you now follow the monk directives.
