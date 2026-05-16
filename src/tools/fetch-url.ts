import { defineCommand } from "citty";
import { getBrowser, closeBrowser } from "../lib/browser";

export default defineCommand({
  meta: {
    name: "fetch-url",
    description: "Fetch a rendered web page via stealth Chromium",
  },
  args: {
    url: {
      type: "positional",
      description: "URL to fetch",
      required: true,
    },
    format: {
      type: "string",
      description: "Output format: text | html | markdown",
      default: "text",
    },
    selector: {
      type: "string",
      description: "CSS selector to extract (default: body)",
      default: "body",
    },
    wait: {
      type: "string",
      description: "Wait condition: load | domcontentloaded | networkidle0 | networkidle2",
      default: "networkidle2",
    },
    timeout: {
      type: "string",
      description: "Timeout in ms",
      default: "30000",
    },
    json: {
      type: "boolean",
      description: "Output JSON",
      default: false,
    },
  },
  async run({ args }) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      );

      await page.goto(args.url, {
        waitUntil: args.wait as any,
        timeout: Number(args.timeout),
      });

      const title = await page.title();
      const finalUrl = page.url();

      let content: string;
      if (args.format === "html") {
        content = await page.$eval(args.selector, (el) => el.outerHTML);
      } else if (args.format === "markdown") {
        content = await page.$eval(args.selector, (el) => {
          const walk = (node: Node): string => {
            if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
            if (node.nodeType !== Node.ELEMENT_NODE) return "";
            const e = node as Element;
            const tag = e.tagName.toLowerCase();
            const inner = Array.from(e.childNodes).map(walk).join("");
            if (/^h[1-6]$/.test(tag)) {
              return `\n\n${"#".repeat(Number(tag[1]))} ${inner}\n\n`;
            }
            if (tag === "a") {
              const href = e.getAttribute("href");
              return href ? `[${inner}](${href})` : inner;
            }
            if (tag === "p" || tag === "br") return `\n\n${inner}`;
            if (tag === "li") return `\n- ${inner}`;
            if (tag === "script" || tag === "style") return "";
            return inner;
          };
          return walk(el).replace(/\n{3,}/g, "\n\n").trim();
        });
      } else {
        content = await page.$eval(args.selector, (el) =>
          (el as HTMLElement).innerText,
        );
      }

      const isJson = args.json;

      if (isJson) {
        console.log(
          JSON.stringify(
            { url: finalUrl, title, format: args.format, content },
            null,
            2,
          ),
        );
      } else {
        console.error(`# ${title}\n# ${finalUrl}\n`);
        console.log(content);
      }
    } finally {
      await page.close();
      await closeBrowser();
    }
  },
});
