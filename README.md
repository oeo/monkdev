```
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⣾⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⡿⠋⣉⣉⠙⢿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⡏⢠⣾⣿⣿⣿⡄⢹⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣧⠈⢿⣿⣿⣿⠃⣸⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣿⣿⣆⠀⠉⠉⠀⢠⣿⣿⣿⡏⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⣿⣿⣆⠀⠀⢠⣿⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣶⣤⣀⠘⣿⣿⣿⠆⢠⣿⣿⣿⠃⢀⣤⣶⣿⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⠏⢠⣿⣿⣿⠃⣰⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⠏⢠⣿⣿⡿⠃⣰⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⡏⢠⣿⣿⡿⠁⣼⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⡟⢠⣿⣿⡟⢀⣼⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⠿⠋⢀⣿⣿⠟⠀⠾⠿⣿⣿⡌⠙⠻⢿⣿⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣶⣶⣶⣶⣿⣿⣿⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠚⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠂⠀⠀⠀⠀⠀⠀⠀⠀
```

# Monkdev

> A coding methodology for LLM agents. Measure. Prove. Cut.

Monkdev is a toolkit plus a persona. The **toolkit** (an MCP server) gives your
agent token-aware codebase ingestion, cross-language symbol search, dependency
mapping, and stealth web browsing. The **persona** ([CLAUDE.md](CLAUDE.md))
constrains behavior: simple over clever, root-cause fixes over band-aids, no
performative code, no wasted tokens. The monk serves the architecture, not the ego.

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/oeo/monkdev/master/scripts/install.sh | bash
```

One line installs or upgrades everything: clones to `~/.monkdev` (override with
`MONK_DIR`), runs `bun install`, registers the MCP server with Claude Code, and
merges the monk directives into `~/.claude/CLAUDE.md` between markers — never
touching your own content outside them. Re-run the same line to upgrade.
Requires [Bun](https://bun.sh) and git.

> The script edits your global agent prompt. Skim
> [`scripts/install.sh`](scripts/install.sh) before piping it to bash.

<details>
<summary><b>Manual install (OpenCode, Claude Desktop, or no curl-pipe)</b></summary>

A full install is two parts: the **MCP server** (tools) and the **monk
directives** (behavior).

**1. Get the code**
- Fresh: `git clone https://github.com/oeo/monkdev.git && cd monkdev`
- Upgrade: `git pull` in the existing checkout.
- `bun install` (Bun required — https://bun.sh).

**2. Register the MCP server** — entrypoint `src/mcp.ts`, run with `bun`. Use an
absolute path and a generous (~60s) timeout for the Chromium cold-start.
- Claude Code: `claude mcp add monk -s user -- bun "$(pwd)/src/mcp.ts"`
- OpenCode / Claude Desktop — add to your MCP config:
  ```json
  "monk": { "type": "local", "command": ["bun", "<abs>/src/mcp.ts"], "timeout": 60000 }
  ```

**3. Install the monk directives** — the directives are this repo's
[`CLAUDE.md`](CLAUDE.md); they belong in your **global** prompt so the
discipline applies everywhere (`~/.claude/CLAUDE.md` for Claude Code; the global
instructions file for OpenCode). Wrap them in markers so upgrades replace cleanly:
  ```
  <!-- BEGIN MONK DIRECTIVES -->
  ...contents of CLAUDE.md...
  <!-- END MONK DIRECTIVES -->
  ```

**4. Configure & verify**
- Optional: `brave-search` needs `BRAVE_API_KEY` in `.env` (copy `.env.example`);
  every other tool works without a key.
- First `screenshot-url` / `fetch-url` call downloads a headless Chromium (~200MB).
- Restart the agent session, then verify the `monk_tree` tool responds.

</details>

## The Arsenal

| Tool | Description |
|---|---|
| `tree` | Maps project architecture cleanly, ranked by heuristic importance with per-file token estimates and a cumulative per-threshold histogram. Honors recursive ignores, drops binaries; `--max-tokens N` keeps only the top-scored files fitting the budget. |
| `context` | Packs entire directories into XML-structured blocks for deep AI ingestion. `--min` / `--max-tokens` select by importance or token budget; `--stats-only` reports the largest `min` that fits a context window. Pipes files through [rtk](https://www.rtk-ai.app/) `read -l minimal` when installed (`--raw` to skip). |
| `catfiles` | Safely reads batches of files with path and LOC headers; `--stats-only` reports LOC and token estimates. |
| `outline` | Extracts structural signatures (classes, functions) while dropping token-heavy bodies. |
| `deps` | Maps dependency graphs across multi-language ecosystems (Node, Rust, Go, Python). |
| `symbol` | Finds cross-language definitions instantly. |
| `log` | Manages tasks (`TODO.md`) via rigid standards. |
| `brave-search` | Searches the web via the Brave Search API. |
| `fetch-url` | Renders and extracts web pages via headless Chromium to bypass bot protection. Prunes nav/footer/script noise (`--raw` to skip) and caps output at `--max-tokens` (default 10000). |
| `screenshot-url` | Captures a PNG of a rendered page via stealth Chromium for visual verification. Supports `--selector`, `--fullpage`, and `--out <file>` (base64 otherwise). |
| `list` / `describe` | Self-documents the toolkit from the CLI (hidden from the MCP surface). |

## Usage

The tools are self-documenting from the CLI:

```bash
./bin/monk list             # list all tools
./bin/monk describe <tool>  # show a tool's args
./bin/monk tree             # map the architecture
```

## Directives

Directives are the monk's verbs — natural-language keywords the operator types to
drive the workflow. The agent recognizes each and runs the matching ritual with
the toolkit. Use them to scaffold your own sessions.

| Directive | What it does |
|---|---|
| `meditate` | Ingest context before acting — `tree` to map, then read the core files. |
| `meditate on <topic>` | Targeted ingestion: focus only on components relevant to the topic. |
| `meditate deeply` | Holistic ingestion: pack whole directories via `context`, dependencies included. |
| `meditate <N>` | Threshold ingestion: exactly the files scoring >= N (1-10); standard ≈ 8, deep ≈ 5. |
| `do_research <topic>` | Parallel Brave searches + stealth-Chromium page reads, then synthesize. |
| `reflect` | Record session wisdom as a git commit (`Completed` / `Decisions` / `Next` / `Patterns`). |
| `recall [topic]` | Search past reflection commits for prior wisdom on a topic. |
| `full_recall` | Review all accumulated reflections at once. |
| `update_docs` | Align the README and co-located docs with the current code truth. |
| `vers` | Report the installed monk toolkit version. |

The full ritual semantics (meditation depths, the Measure–Prove–Cut protocol,
commit formats) live in [CLAUDE.md](CLAUDE.md) under *Explicit Command
Directives* — the agent reads them from your global prompt after install.

## Ignore Rules

`tree` and `context` walk recursively, reading `.gitignore` at every directory
level (rules inherit downward and resolve relative to their own directory).

A built-in blacklist (`MONK_BLACKLIST` in `src/lib/walk.ts`) hard-omits what is
never source: package stores (`node_modules`, `site-packages`, `Pods`, …),
build output (`dist`, `target`, `zig-out`, …), tool caches (`.pytest_cache`,
`.gradle`, `.terraform`, …), lockfiles, and derived artifacts (`*.min.js`,
sourcemaps, `*.tsbuildinfo`). Any directory holding a `pyvenv.cfg` is skipped
as a virtualenv regardless of its name. Files over 500KB are skipped and
surfaced as a warning; byte-identical duplicate files keep only their
best-ranked copy's score.

A `.monkignore` file (same syntax, also recursive) marks paths the monk should
not ingest during general meditation. Such paths are **dropped from `context`**
but still **listed by `tree`** with a `(monk-omit)` tag. This keeps broad
meditation focused while letting the monk target a fogged folder explicitly
(e.g. `monk context vendor`).

## Extending

Tools are built using `citty`. To add a new tool:
1. Create the command in `src/tools/`.
2. Export it in `src/tools/index.ts`.
3. Write an integration test in `tests/` (enforced by `conventions.test.ts`).
