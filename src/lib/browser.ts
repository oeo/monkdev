import { launch } from "cloakbrowser/puppeteer";
import type { Browser } from "puppeteer-core";

let _browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (_browser) return _browser;
  
  _browser = await launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  
  return _browser;
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}
