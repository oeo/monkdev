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

A coding methodology for LLM agents.

The monk toolkit enforces context-first discipline — mandatory pre-flight rules,
token-aware codebase ingestion (`tree`, `context`, `catfiles`), cross-language
symbol search, and a reflection system for recording session wisdom as git commits.
Stealth web browsing (`fetch-url` via [CloakBrowser](https://cloakbrowser.dev/))
rounds out the arsenal.

The monk persona (see [CLAUDE.md](CLAUDE.md)) constrains LLM behavior: no
performative code, no naive confidence, no wasted tokens. Measure. Prove. Cut.

## The Monk Persona

The Monk is a hyper-disciplined AI developer persona with 350 years of experience. Driven by the philosophy that simple solutions are the correct ones, the Monk treats the root cause of a disease rather than applying band-aid patches to symptoms. The Monk favors flat architectures, avoids performative complexity, and enforces strict project boundaries to prevent configuration drift and code rot. Using the `monkdev` toolkit, the Monk operates autonomously to deeply ingest repository context, verify logic in a sandboxed proof-of-concept environment, and cut perfectly deterministic code without hallucination or sycophancy. The Monk serves the architecture, not the ego. See [CLAUDE.md](CLAUDE.md) for the full operational instructions and pre-flight rules.

## The Arsenal

| Tool | Description |
|---|---|
| `tree` | Maps project architecture cleanly, honoring recursive ignores and dropping binaries. |
| `context` | Packs entire directories into XML-structured blocks for deep AI ingestion. |
| `catfiles` | Safely reads isolated file contents with line-number headers. |
| `outline` | Extracts structural signatures (classes, functions) while dropping token-heavy bodies. |
| `deps` | Maps dependency graphs across multi-language ecosystems (Node, Rust, Go, Python). |
| `symbol` | Finds cross-language definitions instantly. |
| `log` | Manages tasks (`TODO.md`) via rigid standards. |
| `brave-search` | Performs stealth web searches via the Brave API. |
| `fetch-url` | Renders and extracts web pages via headless Chromium to bypass bot protection. |
| `screenshot-url` | Captures a PNG of a rendered page via stealth Chromium for visual verification. |
| `list` / `describe` | Self-documents the toolkit schema for LLM tool discovery. |

## Ignore Rules

`tree` and `context` walk recursively, reading `.gitignore` at every directory
level (rules inherit downward and resolve relative to their own directory).

A `.monkignore` file (same syntax, also recursive) marks paths the monk should
not ingest during general meditation. Such paths are **dropped from `context`**
but still **listed by `tree`** with a `(monk-omit)` tag. This keeps broad
meditation focused while letting the monk target a fogged folder explicitly
(e.g. `monk context vendor`).

## Workflow

All directives are natural language keywords defined in `CLAUDE.md` — the human gives them to the LLM, who executes the ritual using the toolkit.

Start every task with context ingestion:

```
meditate                 # standard: tree + core files
meditate on <topic>      # targeted: focus on relevant components
meditate deeply          # full directory ingestion
```

Key session directives:

```
do_research <topic>      # web research via Brave Search + stealth Chromium
reflect                  # record session wisdom as a git commit
recall [topic]           # search past reflection commits
full_recall              # review all accumulated wisdom
update_docs              # align README/CLAUDE.md with codebase truth
vers                     # report current monk toolkit version
```

CLI tools available directly:

```bash
./bin/monk tree          # map the architecture
./bin/monk list          # list all tools
./bin/monk describe <t>  # show tool args
```

## Setup

```bash
bun install
cp .env.example .env # Add your BRAVE_API_KEY
ln -sf "$(pwd)/bin/monk" ~/.local/bin/monk # optional: put `monk` on your PATH
```

> The first `fetch-url` call downloads a headless Chromium (~200MB) via
> CloakBrowser. Expect a slow first invocation while it provisions.

## Usage

All capabilities are self-documenting. Use the CLI to explore the available tools:

```bash
./bin/monk list
./bin/monk describe <tool_name>
```

## MCP Server Integration

To expose these tools directly to your AI environment (e.g., Opencode, Claude Desktop), add this to your MCP configuration:

```json
{
  "mcp": {
    "monk": {
      "type": "local",
      "command": ["bun", "run", "/absolute/path/to/monkdev/src/mcp.ts"],
      "enabled": true,
      "environment": {
        "BRAVE_API_KEY": "your_key_here"
      },
      "timeout": 60000
    }
  }
}
```

> Set `timeout` generously (60s shown). OpenCode defaults to 5s, which is too
> short for the Chromium cold-start (`fetch-url`) or scanning large directories
> (`tree`, `symbol`, `context`).

## Extending

Tools are built using `citty`. To add a new tool:
1. Create the command in `src/tools/`.
2. Export it in `src/tools/index.ts`.
3. Write an integration test in `tests/` (enforced by CI).
