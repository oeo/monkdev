import { launch } from "cloakbrowser/puppeteer";
import type { Browser, Page } from "puppeteer-core";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

let _browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (_browser) return _browser;
  
  _browser = await launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  
  return _browser;
}

export async function newStealthPage(): Promise<Page> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  return page;
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}
