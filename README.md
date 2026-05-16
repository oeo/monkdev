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
