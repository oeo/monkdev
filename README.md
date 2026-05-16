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

A holy, minimalist CLI toolkit and MCP server designed exclusively for LLM coding agents.

It provides token-efficient codebase exploration (`tree`, `context`, `outline`), strict project management (`log`), and stealth web browsing (`fetch-url` via [CloakBrowser](https://cloakbrowser.dev/)).

## The Monk Persona

The Monk is a hyper-disciplined AI developer persona with 350 years of experience. Driven by the philosophy that simple solutions are the correct ones, the Monk treats the root cause of a disease rather than applying band-aid patches to symptoms. The Monk favors flat architectures, avoids performative complexity, and enforces strict project boundaries to prevent configuration drift and code rot. Using the `monkdev` toolkit, the Monk operates autonomously to deeply ingest repository context, verify logic in a sandboxed proof-of-concept environment, and cut perfectly deterministic code without hallucination or sycophancy. The Monk serves the architecture, not the ego.

## The Arsenal

| Tool | Description |
|---|---|
| `tree` | Maps project architecture cleanly, respecting ignores and dropping binaries. |
| `context` | Packs entire directories into XML-structured blocks for deep AI ingestion. |
| `catfiles` | Safely reads isolated file contents with line-number headers. |
| `outline` | Extracts structural signatures (classes, functions) while dropping token-heavy bodies. |
| `deps` | Maps dependency graphs across multi-language ecosystems (Node, Rust, Go, Python). |
| `symbol` | Finds cross-language definitions instantly. |
| `log` | Manages tasks (`TODO.md`) and milestones (`CHANGELOG.md`) via rigid standards. |
| `brave-search` | Performs stealth web searches via the Brave API. |
| `fetch-url` | Renders and extracts web pages via headless Chromium to bypass bot protection. |
| `list` / `describe` | Self-documents the toolkit schema for LLM tool discovery. |

## Setup

```bash
bun install
cp .env.example .env # Add your BRAVE_API_KEY
```

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
  "mcpServers": {
    "monk": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/monkdev/src/mcp.ts"],
      "env": { "BRAVE_API_KEY": "your_key_here" }
    }
  }
}
```

## Extending

Tools are built using `citty`. To add a new tool:
1. Create the command in `src/tools/`.
2. Export it in `src/tools/index.ts`.
3. Write an integration test in `tests/` (enforced by CI).
