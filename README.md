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
| `#make_skill [scope]` | Preview a durable project skill from current-session work, then write it only after approval. |
| `#reflect` | Record session wisdom as a git commit. |
| `#recall [N\|topic\|all]` | Search past reflection commits. |
| `#spawn N <desc>` | Run N sub-agents on scoped tasks in parallel. |
| `#cur` / `#cur done` | Read or update the cur.md task list. |
| `#attack [N]` | N sub-agents meditate, then attack your plan before you build. |
| `#audit <cmd>` | Codebase under oath: gate, debt, smell, split, sec, perf, bugs, mod, arch, drift, all. |
| `#canon [path]` | Find facts written down in several languages, name the canonical home for each. |
| `#audit drift [path]` | Find one fact declared at two versions across manifests and config. |
| `#plan` | Plan mode. Checkbox steps, confidence scores, net LOC per phase. |
| `#dev` | Detect and start the local dev environment. |
| `#version` | Report the installed toolkit version. |
| `#help` | Print all commands as a man page. |

Full ritual semantics live in [CLAUDE.md](CLAUDE.md) under *Explicit Command
Directives*.

## Working Effectively

The tools are cheap. The mistakes are expensive. Each recipe below exists
because the shortcut it replaces costs more tokens or returns worse answers.

**Land in an unfamiliar repo.** Shape first, then gauge, then ingest.

```bash
monk tree                        # ranked map; read the histogram in the footer
monk context . --stats-only      # what a given --min would actually cost
monk context . --min 7           # writes to a temp file above ~10k tokens
```

Take `--min` from the printed histogram, never from memory. Scores are relative
to the scan root, so a threshold read at the root does not transfer to a
subtree, and the scale turns rank-percentile once a repo passes 100 files.
Higher `--min` means fewer files, so `--min 10` is the narrowest view there is,
not an overview. For shape, use `tree`.

**Chase a defect.** Go straight to the definition, then read whole files.

```bash
monk symbol handleAuth           # cross-language definitions
monk catfiles src/a.ts src/b.ts  # one call, whole files, LOC headers
monk outline src/big.ts          # signatures only, when shape is enough
```

**Scope a refactor.** Budget the ingest instead of guessing a threshold.

```bash
monk tree packages/api --min 6
monk context packages/api --max-tokens 60000   # packs top-scored files that fit
monk deps packages/api                         # dev and indirect listed apart
```

**Find the source of truth.** `canon` clusters facts restated across languages.

```bash
monk canon packages/api          # narrow by path
monk canon . --max-files 100     # parallel implementations of one contract
```

Narrow by path rather than raising `--min`. A high `--min` keeps only manifests
and entry points, which share generic vocabulary and lower precision. Raise
`--max-files` when several services or SDKs restate one model, because there
the shared fact is the widest thing in the repo. Output is a candidate list.
Read the copies before calling anything drift.

**Prove the change helped.** Record a baseline, change one thing, compare.

```bash
bun run bench --save             # before
bun run bench                    # after, with deltas
```

Habits that pay for themselves:

| Instead of | Use | Why |
|---|---|---|
| `cat` / `head` / `tail` | `catfiles` | One call, whole files, no slicing blind |
| `grep` for a definition | `symbol` | Finds it across languages, ranked by importance |
| Dumping `context` to the terminal | Let it write a file, then read it | Terminals truncate; the file does not |
| Raising `--min` to cut canon noise | Narrowing by path | High `--min` lowers canon precision |
| Asserting a change worked | `bun run bench` | Wall time lies; the token and count columns do not |

## Prompting the Agent

The recipes above are what the agent runs. These are what you type. Directives
compose, and the order matters more than the wording.

**Refactor without breaking things.** Ingest, plan, attack, then build.

```
#meditate 6 on packages/auth
#plan consolidate the three token validators into one
#attack 3
```

`#plan` emits checkbox steps carrying a confidence score each and a net LOC
delta per phase, and any refactor plan must end with a cleanup phase. `#attack`
spawns adversaries that meditate before criticizing, each returning a confidence
score and the single largest risk. A third `#plan` leaves plan mode and
executes.

Ask for subtraction in the prompt, or you will get addition:

```
#plan remove the adapter layer in src/http and inline its two call sites.
Net LOC must be negative. If it cannot be, say why and stop.
```

**Distill repeatable work.** Preview a project skill before adding it:

```
#make_skill browser verification
```

The command writes nothing until you approve the complete `SKILL.md` preview.

**Remove dead code.** Audit first, then reference findings by ID.

```
#audit debt smell packages/api
fix h1 m3
```

One caveat decides whether this is safe. Monk finds definitions, not callers.
`symbol` answers "where is this defined" across languages, and no tool here
answers "who calls this". For deletion, the second question is the one that
matters, so plain `grep` is correct for call sites. The directive banning grep
bans it for definitions only.

```
#meditate on packages/api
List every exported symbol. For each, take the definition from monk_symbol and
the call sites from grep. Report only those with no caller outside their own
file, with counts. Delete nothing until I confirm the list.
```

**Collapse duplicated truth.** Findings name where the fact should live.

```
#canon packages/api
fix c1 c2
```

Each finding names a canonical home and the generation or import path that keeps
the other copies honest. Where no such path exists, the agent proposes a check
that fails loudly instead.

`#canon` covers a fact restated across languages. Its sibling covers the same
fact restated across manifests in one language, which `canon` cannot see:

```
#audit drift .
fix h1 h2
```

Reading every manifest in a large polyglot repo costs under 10k tokens, so this
runs on the whole tree rather than a sample. Most of its value is knowing what
is not drift: Cargo workspace inheritance, `path` and `catalog:` specifiers,
peer dependency ranges, and semver-equal spellings like `^19` and `^19.0.0`.

**Habits inside the scaffold.**

| Habit | Why it pays |
|---|---|
| Open non-trivial work with `#meditate <target>` | The pre-flight loads project skills, `AGENTS.md`, and recent reflections before anything is proposed |
| `#recall <topic>` before re-reading source | Past decisions and their reasoning live in commit bodies, far cheaper than re-ingesting the repo |
| `#spawn N <task>` for scoped parallel work | Sub-agents inherit the directives and are handed a contract that makes them meditate before acting |
| `#attack` before any non-trivial build | Losing an argument to five adversaries is cheaper than shipping the plan |
| `#reflect` at the end of a session | The next session starts with this one's reasoning, not just its diff |

Two phrases change the answer you get:

- **root cause.** The agent must emit `root cause: <file:symbol> | fix lands:
  <file:symbol>` before editing. Two different places means it is patching a
  symptom, and it has to say so.
- **net LOC.** Forces a plan to account for what it adds rather than only for
  what it delivers.

## Ignore Rules

`tree` and `context` honor `.gitignore` at every directory level. A built-in
blacklist drops what is never source: package stores, build output, caches,
lockfiles, minified artifacts, and files over 500KB.

A `.monkignore` file (same syntax) fogs paths from general meditation. `context`
drops them, `tree` still lists them with a `(monk-omit)` tag, and you can always
target a fogged folder explicitly.

## Benchmarks

```bash
bun run bench                    # defaults to the current directory
bun run bench /path/to/repo      # one baseline per target
bun run bench --save             # re-record the baseline
bun run bench --watch            # re-measure on every save under src/
```

`bench` records median wall time, output tokens, and result counts for each tool
against a real repo, then prints the delta against your local baseline. Tokens
and counts are deterministic. Wall time carries a few percent of noise within a
run and more across sessions, so treat anything under 5% as flat and distrust
cross-session comparisons. Baselines are gitignored because timings are
machine-specific.

```bash
bun run corpus                   # fetch the pinned evaluation corpus
bun run efficacy                 # score canon recall and noise against it
```

`corpus` fetches five implementations of one API spec in four languages, pinned
by SHA. Because the spec defines which facts are restated, `efficacy` can score
recall objectively. Its precision figure is a proxy: it penalizes known
vocabulary only, so it cannot catch novel noise.

## Extending

Tools are built with `citty`. To add one:
1. Create the command in `src/tools/`.
2. Export it in `src/tools/index.ts`.
3. Write an integration test in `tests/` (enforced by `conventions.test.ts`).
