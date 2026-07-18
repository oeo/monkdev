import { launch, Browser, Page } from "rebrowser-puppeteer-core";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

let _browser: Browser | null = null;
let persist = false;

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

function findChrome(): string {
  for (const p of CHROME_PATHS) {
    const f = Bun.file(p);
    if (f.size > 0) return p;
  }
  throw new Error("Chrome not found. Install Google Chrome or Chromium.");
}

// Called by the MCP server so the browser survives across tool calls.
export function persistBrowser(): void {
  persist = true;
}

export async function getBrowser(): Promise<Browser> {
  if (_browser) return _browser;

  _browser = await launch({
    executablePath: findChrome(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
  });

  return _browser;
}

export async function newStealthPage(): Promise<Page> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  return page;
}

export async function closeBrowser(force = false): Promise<void> {
  if (persist && !force) return;
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}
