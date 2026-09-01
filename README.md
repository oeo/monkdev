<p align="center">
  <img src="assets/monk.svg" width="420" alt="monk seated in meditation">
</p>

# Monkdev

> A coding methodology for LLM agents. Measure. Prove. Cut.

Monkdev combines token-aware codebase tools with a resident engineering
methodology. Tools map and ingest source. Directives make agents seek root
causes, prefer smaller fixes, prove changes, and preserve reasoning in git.

## Setup

Required:

- [Bun](https://bun.sh) and git.
- [Caveman](https://github.com/JuliusBrussee/caveman) for terse agent output:

  ```bash
  npx skills add JuliusBrussee/caveman
  ```

- A [Brave Search API token](https://brave.com/search/api/) for `brave-search`
  and `#do_r`. Store it after installing Monkdev:

  ```bash
  cp ~/.monkdev/.env.example ~/.monkdev/.env
  # replace BRAVE_API_KEY in ~/.monkdev/.env
  ```

- Google Chrome or Chromium for `fetch-url` and `screenshot-url`. Set
  `MONK_CHROME` when its binary is outside an auto-detected path.

Install or upgrade Monkdev:

```bash
curl -fsSL https://raw.githubusercontent.com/oeo/monkdev/master/scripts/install.sh | bash
```

Installer clones to `~/.monkdev`, installs dependencies, registers available
agent integrations, and merges directives between markers without replacing
operator content. Restart agent session, then verify `monk_tree` responds.

Use [`INSTALL.md`](INSTALL.md) for manual or unsupported-scaffold setup. Review
[`scripts/install.sh`](scripts/install.sh) before piping it into a shell.

## In-Scaffold Workflow

Type these into your coding agent. They are directives, not shell commands.

**Understand before changing:**

```text
#med on packages/auth
```

**Plan, attack, and synthesize without implementing:**

```text
#plan consolidate token validation at its source | #attack 3
```

Attackers check root-cause placement, simpler options, overengineering,
maintainability, scope creep, pragmatism, net LOC, and test value. Result stays
paused until explicit approval such as `implement this plan`.

**Research with full source reads:**

```text
#do_r current browser cookie partitioning behavior
```

**Audit and fix selected findings:**

```text
#audit bugs sec src/
fix h1 m2
```

**Find duplicated truth across languages:**

```text
#canon packages/api
fix c1
```

**Align docs, then preserve session reasoning:**

```text
#update_docs
#reflect
```

## Directives

| Directive | Purpose |
|---|---|
| `#meditate` / `#med` | Map, gauge, ingest, research, then act. |
| `#do_research` / `#do_r` | Search in parallel, read full sources, synthesize. |
| `#plan [task]` | Produce a paused, executable plan with confidence and net LOC. |
| `#attack [N]` | Attack a plan and return one stronger paused plan. |
| `#audit <cmd>` | Find gate, debt, smell, split, security, performance, bug, modernization, architecture, or drift issues. |
| `#canon [path]` | Find facts restated across languages and name their canonical home. |
| `#spawn N <desc>` | Run scoped sub-agents in parallel. |
| `#make_skill [scope]` | Preview durable session procedure as a project skill. |
| `#update_docs` | Align existing docs with current code truth. |
| `#cur` / `#cur done` | Read or update human-owned `cur.md`. |
| `#recall [N\|topic\|all]` | Read prior reflection decisions. |
| `#reflect` | Commit session work and reasoning without pushing. |
| `#dev` | Detect and start project development environment. |
| `#help` | Print full directive reference. |

Full contracts live in [`CLAUDE.md`](CLAUDE.md).

## Tools

| Tool | Purpose |
|---|---|
| `tree` | Rank project files by architectural importance. |
| `context` | Pack a directory into filtered XML. |
| `catfiles` | Read known files together with LOC headers. |
| `outline` | Extract signatures without implementation bodies. |
| `deps` | Map Node, Rust, Go, and Python dependencies. |
| `symbol` | Find cross-language symbol definitions. |
| `canon` | Cluster candidate facts restated across languages. |
| `brave-search` | Search web through Brave Search API. |
| `fetch-url` | Render and extract a page through Chrome. |
| `screenshot-url` | Capture a rendered page as PNG. |

```bash
monk list
monk describe <tool>
monk tree
monk context . --stats-only
```

Use `symbol` for definitions and normal text search for call sites. Let
`context` write large output to a file; terminal output can truncate.

## Development

```bash
bun install
bun test tests/
bun run bench --save
bun run bench
```

Tools are registered through `src/tools/index.ts`. Each tool requires an
integration test under `tests/`.
