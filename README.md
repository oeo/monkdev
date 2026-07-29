<p align="center">
  <img src="assets/monk.svg" width="420" alt="monk seated in meditation">
</p>

# Monkdev

> A coding methodology for LLM agents. Measure. Prove. Cut.

Monkdev is two things. A toolkit, an MCP server that gives your agent
token-aware codebase ingestion, symbol search, dependency mapping, and stealth
web browsing. And a persona, [CLAUDE.md](CLAUDE.md), which keeps the agent
simple, honest, and frugal with tokens. The monk serves the architecture, not
the ego.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/oeo/monkdev/master/scripts/install.sh | bash
```

This clones to `~/.monkdev`, runs `bun install`, registers the MCP server, and
merges the monk directives into your global agent prompt between markers. It
never touches your own content outside them. Works with Claude Code, OpenCode,
and pi. Run the same line again to upgrade. Needs [Bun](https://bun.sh) and git.

The script edits your global agent prompt, so skim
[`scripts/install.sh`](scripts/install.sh) first.

Prefer to install by hand, or on another scaffold? Follow
[`INSTALL.md`](INSTALL.md), or tell your agent:

```
Fetch https://raw.githubusercontent.com/oeo/monkdev/master/INSTALL.md and follow it.
```

Optional setup: `brave-search` needs `BRAVE_API_KEY` in `.env`. `fetch-url` and
`screenshot-url` need Chrome or Chromium installed (set `MONK_CHROME` to
override detection). Everything else works out of the box.

## Tools

| Tool | What it does |
|---|---|
| `tree` | Maps the project, ranked by importance, with token estimates. |
| `context` | Packs directories into XML for deep ingestion. Filter by `--min` score or `--max-tokens` budget. |
| `catfiles` | Reads batches of files with path and LOC headers. |
| `outline` | Extracts classes and functions, drops the bodies. |
| `deps` | Maps dependency graphs (Node, Rust, Go, Python). |
| `symbol` | Finds definitions across languages. |
| `canon` | Clusters facts restated in more than one language: candidate drift. |
| `brave-search` | Searches the web via the Brave API. |
| `fetch-url` | Renders and extracts web pages through stealth Chrome. |
| `screenshot-url` | Captures a PNG of a rendered page. |

The tools document themselves from the CLI:

```bash
./bin/monk list             # list all tools
./bin/monk describe <tool>  # show a tool's args
./bin/monk tree             # map the architecture
```

## Directives

Directives are keywords you type to drive the workflow. All take the `#`
prefix and compose with `|` for pipes.

| Directive | What it does |
|---|---|
| `#meditate [topic\|deeply\|N]` | Ingest context before acting. Target a topic, go deep, or set an importance threshold. |
| `#do_research <topic>` | Parallel web searches plus page reads, then synthesize. |
| `#update_docs` | Align docs with the current code truth. |
| `#reflect` | Record session wisdom as a git commit. |
| `#recall [N\|topic\|all]` | Search past reflection commits. |
| `#spawn N <desc>` | Run N sub-agents on scoped tasks in parallel. |
| `#cur` / `#cur done` | Read or update the cur.md task list. |
| `#attack [N]` | N sub-agents meditate, then attack your plan before you build. |
| `#audit <cmd>` | Codebase under oath: gate, debt, smell, sec, perf, bugs, arch, all. |
| `#canon [path]` | Find facts written down in several languages, name the canonical home for each. |
| `#plan` | Plan mode. Checkbox steps, confidence scores, net LOC per phase. |
| `#dev` | Detect and start the local dev environment. |
| `#version` | Report the installed toolkit version. |
| `#help` | Print all commands as a man page. |

Full ritual semantics live in [CLAUDE.md](CLAUDE.md) under *Explicit Command
Directives*.

## Ignore Rules

`tree` and `context` honor `.gitignore` at every directory level. A built-in
blacklist drops what is never source: package stores, build output, caches,
lockfiles, minified artifacts, and files over 500KB.

A `.monkignore` file (same syntax) fogs paths from general meditation. `context`
drops them, `tree` still lists them with a `(monk-omit)` tag, and you can always
target a fogged folder explicitly.

## Benchmarks

```bash
bun run bench                    # defaults to ~/www/ghostpeek-v2
bun run bench /path/to/repo      # one baseline per target
bun run bench --save             # re-record the baseline
bun run bench --watch            # re-measure on every save under src/
```

```bash
bun run corpus                   # fetch the pinned evaluation corpus
bun run efficacy                 # score canon recall and noise against it
```

`corpus` fetches five implementations of one API spec in four languages, pinned
by SHA. Because the spec defines which facts are restated, `efficacy` can score
recall objectively. Its precision figure is a proxy: it penalizes known
vocabulary only, so it cannot catch novel noise.

Records median wall time, output tokens, and result counts for each tool against
a real repo, then prints the delta against your local baseline. Tokens and counts
are deterministic; wall time carries a few percent of noise, so treat anything
under 5% as flat. Baselines are gitignored because timings are machine-specific.

## Extending

Tools are built with `citty`. To add one:
1. Create the command in `src/tools/`.
2. Export it in `src/tools/index.ts`.
3. Write an integration test in `tests/` (enforced by `conventions.test.ts`).
