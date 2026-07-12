import { defineCommand } from "citty";
import { newStealthPage, closeBrowser } from "../lib/browser";

export default defineCommand({
  meta: {
    name: "screenshot-url",
    description: "Capture a PNG screenshot of a rendered web page via stealth Chromium",
  },
  args: {
    url: {
      type: "positional",
      description: "URL to capture",
      required: true,
    },
    selector: {
      type: "string",
      description: "CSS selector to capture (default: full viewport)",
    },
    fullpage: {
      type: "boolean",
      description: "Capture the entire scrollable page (ignored with --selector)",
      default: false,
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
    out: {
      type: "string",
      description: "Write the PNG to this file path instead of emitting base64",
    },
  },
  async run({ args }) {
    const page = await newStealthPage();

    try {
      await page.goto(args.url, {
        waitUntil: args.wait as any,
        timeout: Number(args.timeout),
      });

      const target: any = args.selector ? await page.$(args.selector) : page;
      if (!target) throw new Error(`Selector not found: ${args.selector}`);

      const opts: any = { type: "png" };
      if (!args.selector && args.fullpage) opts.fullPage = true;

      if (args.out) {
        await target.screenshot({ ...opts, path: args.out });
        console.log(args.out);
      } else {
        console.log(await target.screenshot({ ...opts, encoding: "base64" }));
      }
    } finally {
      await page.close();
      await closeBrowser();
    }
  },
});
