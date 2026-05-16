import { defineCommand } from "citty";

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
    
    // Fallback: If not in env, try to load it from the monkdev installation directory
    if (!key) {
      try {
        // Hardcoding the known installation path for global reliability
        const envContent = await Bun.file("/Users/taky/www/monk/.env").text();
        const match = envContent.match(/BRAVE_API_KEY=(.*)/);
        if (match && match[1]) {
          key = match[1].trim();
        }
      } catch (e) {}
    }

    if (!key) {
      console.error("Missing BRAVE_API_KEY in env or /Users/taky/www/monk/.env");
      process.exit(1);
      return;
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
      console.error(`Brave API error: ${res.status} ${res.statusText}`);
      console.error(await res.text());
      process.exit(1);
      return;
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
