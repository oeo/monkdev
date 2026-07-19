import { launch, Browser, Page } from "rebrowser-puppeteer-core";

// Promise-cached so concurrent callers share one launch instead of racing
// into a second Chrome. A disconnect clears the cache for relaunch.
let _browser: Promise<Browser> | null = null;
let persist = false;

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

export function findChrome(): string {
  if (process.env.MONK_CHROME) return process.env.MONK_CHROME;
  for (const p of CHROME_PATHS) {
    const f = Bun.file(p);
    if (f.size > 0) return p;
  }
  throw new Error(
    "Chrome not found. Install Google Chrome or Chromium, or set MONK_CHROME to the binary path.",
  );
}

// Called by the MCP server so the browser survives across tool calls.
export function persistBrowser(): void {
  persist = true;
}

export function getBrowser(): Promise<Browser> {
  if (_browser) return _browser;

  const launching = launch({
    executablePath: findChrome(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
  }).then((browser) => {
    browser.on("disconnected", () => {
      if (_browser === launching) _browser = null;
    });
    return browser;
  });
  launching.catch(() => {
    if (_browser === launching) _browser = null;
  });

  _browser = launching;
  return launching;
}

export async function newStealthPage(): Promise<Page> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  // Real binary UA minus the headless marker, so the version never goes stale.
  const ua = (await browser.userAgent()).replace("HeadlessChrome", "Chrome");
  await page.setUserAgent(ua);
  return page;
}

export async function closeBrowser(force = false): Promise<void> {
  if (persist && !force) return;
  if (!_browser) return;
  const pending = _browser;
  _browser = null;
  const browser = await pending.catch(() => null);
  if (browser) await browser.close();
}
