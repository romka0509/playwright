const express = require('express');
const { chromium } = require('playwright');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 8080;

// ======== АНТИДЕТЕКТ та ТВОЇ ДАНІ ==========

// Твій user-agent:
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.128 Safari/537.36";

// Твої кукі
const COOKIES = [
  { "name": "sb", "value": "-0BBZpYRgKBE876qcOFcxqNT", "domain": ".facebook.com", "path": "/" },
  { "name": "datr", "value": "_EBBZpx3eWjjNfCuYsHeQXMT", "domain": ".facebook.com", "path": "/" },
  { "name": "c_user", "value": "100016128750721", "domain": ".facebook.com", "path": "/" },
  { "name": "ps_l", "value": "1", "domain": ".facebook.com", "path": "/" },
  { "name": "ps_n", "value": "1", "domain": ".facebook.com", "path": "/" },
  { "name": "presence", "value": "C%7B%22t3%22%3A%5B%5D%2C%22utc3%22%3A1749331040651%2C%22v%22%3A1%7D", "domain": ".facebook.com", "path": "/" },
  { "name": "wd", "value": "1656x952", "domain": ".facebook.com", "path": "/" },
  { "name": "fr", "value": "1eVkqbkYKVQnHy4gA.AWe1qnlHPiXVwKrZFLCMMLp80qSNR_fWKHmsxiqtBHX1O150f2Y.BoSaPa..AAA.0.0.BoSaPa.AWcXzg5x-z316WUKCIijkjbIW6Q", "domain": ".facebook.com", "path": "/" },
  { "name": "xs", "value": "33%3AC6w1SSavbUF5cQ%3A2%3A1715552532%3A-1%3A-1%3A%3AAcWjLZrzqM2xtoKXUcrrRDWnDVkK_9Xaad9pnc7bFA", "domain": ".facebook.com", "path": "/" },
  { "name": "alsfid", "value": "{\"id\":\"f20786144\",\"timestamp\":1749656552951.3}", "domain": ".facebook.com", "path": "/" }
];

// Твій HTTP-проксі
const PROXY = "http://yEwHxb91:MLpy9sXG@156.246.130.157:64768";

// =========== Playwright антидетект ==========
const sleep = ms => new Promise(res => setTimeout(res, ms));

async function extractMp4Links(page) {
  // Всі mp4, які зустрілись на сторінці:
  const links = await page.$$eval('video source[src$=".mp4"], video[src$=".mp4"]', nodes =>
    nodes.map(n => n.src || n.getAttribute('src'))
  );

  // Також mp4 у js, xhr чи data-атрибутах (іноді meta-cdn)
  const html = await page.content();
  const reg = /https?:\/\/[^"' >]+\.mp4/g;
  const found = html.match(reg) || [];

  // Унікальні лінки:
  return Array.from(new Set([...links, ...found]));
}

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "error", message: "No url provided" });

  let browser;
  try {
    browser = await chromium.launch({
      headless: false, // важливо для антидетекту!
      args: [
        `--proxy-server=${PROXY}`,
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage'
      ],
      timeout: 120000
    });

    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 900 },
      ignoreHTTPSErrors: true,
      locale: "en-US"
    });

    await context.addCookies(COOKIES);

    const page = await context.newPage();

    // Сліпий JS-патч для затирання headless fingerprint:
    await page.addInitScript(() => {
      // JS: navigator.webdriver = false
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      // Plugins + Languages
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    // Додаткова антибот поведінка (клік, скрол тощо):
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
    await sleep(3000);
    await page.mouse.move(100, 200);
    await page.keyboard.press('PageDown');
    await sleep(2000);
    await page.keyboard.press('PageDown');
    await sleep(2000);

    // Прокрути вниз
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 500);
      await sleep(1200 + Math.random() * 1000);
    }

    // Отримай всі mp4
    const mp4_links = await extractMp4Links(page);

    // Дебаг-логування
    // const html = await page.content();
    // fs.writeFileSync('debug.html', html);

    res.json({ status: "ok", url, mp4_links });
    await browser.close();
  } catch (e) {
    if (browser) await browser.close();
    res.json({ status: "error", error: e.message, stack: e.stack });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
