import { defineCommand } from "citty";
import { newStealthPage, closeBrowser } from "../lib/browser";

function truncateAtTokens(content: string, maxTokens: number) {
  const maxChars = maxTokens * 4;
  if (maxTokens <= 0 || content.length <= maxChars) return { content, truncated: false };
  let cut = content.lastIndexOf("\n", maxChars);
  if (cut < maxChars / 2) cut = maxChars; // no useful line boundary; hard cut
  const omitted = Math.ceil((content.length - cut) / 4);
  return {
    content:
      content.slice(0, cut) +
      `\n\n[monk: truncated at ~${maxTokens} tokens, ~${omitted} tokens omitted — narrow with --selector, or raise --max-tokens]`,
    truncated: true,
  };
}

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
      default: "7500",
    },
    "max-tokens": {
      type: "string",
      description: "Cap output at ~N tokens (chars/4). 0 disables.",
      default: "10000",
    },
    raw: {
      type: "boolean",
      description: "Skip noise-element pruning (nav/header/footer/script...)",
      default: false,
    },
    json: {
      type: "boolean",
      description: "Output JSON",
      default: false,
    },
  },
  async run({ args }) {
    const page = await newStealthPage();

    try {
      await page.goto(args.url, {
        waitUntil: args.wait as any,
        timeout: Number(args.timeout),
      });

      const title = await page.title();
      const finalUrl = page.url();

      if (!args.raw) {
        await page.evaluate(() => {
          document
            .querySelectorAll(
              "script,style,noscript,nav,header,footer,aside,template,iframe",
            )
            .forEach((el) => el.remove());
        });
      }

      let content: string;
      if (args.format === "html") {
        content = await page.$eval(args.selector, (el) => el.outerHTML);
      } else if (args.format === "markdown") {
        content = await page.$eval(args.selector, (el) => {
          const walk = (node: Node): string => {
            if (node.nodeType === Node.TEXT_NODE) {
              return (node.textContent ?? "").replace(/\s+/g, " ");
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return "";
            const e = node as Element;
            const tag = e.tagName.toLowerCase();
            if (tag === "script" || tag === "style") return "";
            if (tag === "br") return "\n";
            if (tag === "pre") {
              return `\n\n\`\`\`\n${(e.textContent ?? "").trim()}\n\`\`\`\n\n`;
            }
            const inner = Array.from(e.childNodes).map(walk).join("");
            if (/^h[1-6]$/.test(tag)) {
              return `\n\n${"#".repeat(Number(tag[1]))} ${inner}\n\n`;
            }
            if (tag === "a") {
              const href = e.getAttribute("href");
              return href ? `[${inner}](${href})` : inner;
            }
            if (tag === "code") return `\`${inner}\``;
            if (tag === "strong" || tag === "b") return `**${inner}**`;
            if (tag === "em" || tag === "i") return `*${inner}*`;
            if (tag === "blockquote") return `\n\n> ${inner.trim()}\n\n`;
            if (tag === "p") return `\n\n${inner}`;
            if (tag === "li") {
              const parent = e.parentElement;
              if (parent?.tagName === "OL") {
                const n = Array.prototype.indexOf.call(parent.children, e) + 1;
                return `\n${n}. ${inner}`;
              }
              return `\n- ${inner}`;
            }
            return inner;
          };
          return walk(el);
        });
      } else {
        content = await page.$eval(args.selector, (el) =>
          (el as HTMLElement).innerText,
        );
      }

      if (args.format !== "html") {
        content = content
          .split("\n")
          .map((l) => l.trimEnd())
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      }

      const capped = truncateAtTokens(content, Number(args["max-tokens"]));
      content = capped.content;

      const isJson = args.json;

      if (isJson) {
        console.log(
          JSON.stringify(
            { url: finalUrl, title, format: args.format, truncated: capped.truncated, content },
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
