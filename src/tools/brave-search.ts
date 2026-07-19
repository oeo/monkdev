import { defineCommand } from "citty";
import { join } from "node:path";

export default defineCommand({
  meta: {
    name: "brave-search",
    description: "Search the web via Brave Search API",
  },
  args: {
    query: {
      type: "positional",
      description: "Search query",
      required: true,
    },
    count: {
      type: "string",
      description: "Number of results (1-20)",
      default: "10",
    },
    json: {
      type: "boolean",
      description: "Output JSON",
      default: false,
    },
  },
  async run({ args }) {
    let key = process.env.BRAVE_API_KEY;
    
    // Fallback: If not in env, try to load it from the monkdev installation
    // directory. An absent or unreadable .env falls through to the explicit
    // missing-key error below.
    if (!key) {
      try {
        const envContent = await Bun.file(join(import.meta.dir, "../../.env")).text();
        const line = envContent.split("\n").find((l) => l.startsWith("BRAVE_API_KEY="));
        if (line) key = line.slice("BRAVE_API_KEY=".length).trim();
      } catch {}
    }

    if (!key) {
      throw new Error("Missing BRAVE_API_KEY in env or .env file");
    }

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", args.query);
    url.searchParams.set("count", String(args.count));

    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": key,
      },
    });

    if (!res.ok) {
      throw new Error(`Brave API error: ${res.status} ${res.statusText}\n${await res.text()}`);
    }

    const data = (await res.json()) as {
      web?: { results?: Array<{ title: string; url: string; description: string }> };
    };

    const results =
      data.web?.results?.map((r) => ({
        title: r.title,
        url: r.url,
        description: r.description,
      })) ?? [];

    const isJson = args.json;

    if (isJson) {
      console.log(JSON.stringify({ query: args.query, results }, null, 2));
    } else {
      if (!results.length) {
        console.log("No results.");
        return;
      }
      for (const [i, r] of results.entries()) {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   ${r.url}`);
        console.log(`   ${r.description}\n`);
      }
    }
  },
});
