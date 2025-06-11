import express from "express";
import { chromium } from "playwright";

const app = express();
const PORT = process.env.PORT || 8080;

// === ТВОЇ ДАНІ ===
const FACEBOOK_URL = 'https://www.facebook.com/ads/library/?active_status=active';
const PROXY_SERVER = 'socks5://yEwHxb91:MLpy9sXG@156.246.130.157:64768';

// Твої кукі (розпарсимо в об'єкти)
const RAW_COOKIES = `sb=-0BBZpYRgKBE876qcOFcxqNT; datr=_EBBZpx3eWjjNfCuYsHeQXMT; c_user=100016128750721; ps_l=1; ps_n=1; presence=C%7B%22t3%22%3A%5B%5D%2C%22utc3%22%3A1749331040651%2C%22v%22%3A1%7D; wd=1656x952; fr=1eVkqbkYKVQnHy4gA.AWe1qnlHPiXVwKrZFLCMMLp80qSNR_fWKHmsxiqtBHX1O150f2Y.BoSaPa..AAA.0.0.BoSaPa.AWcXzg5x-z316WUKCIijkjbIW6Q; xs=33%3AC6w1SSavbUF5cQ%3A2%3A1715552532%3A-1%3A-1%3A%3AAcWjLZrzqM2xtoKXUcrrRDWnDVkK_9Xaad9pnc7bFA; alsfid={"id":"f20786144","timestamp":1749656552951.3}`;

function parseCookies(str) {
  return str.split('; ').map(pair => {
    const [name, ...rest] = pair.split('=');
    return { name, value: rest.join('='), domain: '.facebook.com', path: '/' };
  });
}

// === ГОЛОВНА ФУНКЦІЯ ПАРСИНГУ ===
async function scrapeFacebookAdsLibrary() {
  console.log(`[INFO] Launching browser with proxy: ${PROXY_SERVER}`);
  const browser = await chromium.launch({
    headless: true,
    proxy: {
      server: PROXY_SERVER
    }
  });

  const context = await browser.newContext();
  await context.addCookies(parseCookies(RAW_COOKIES));

  const page = await context.newPage();

  // Логи для дебага
  page.on('console', msg => console.log(`[BROWSER][CONSOLE] ${msg.text()}`));
  page.on('requestfailed', req => console.error(`[BROWSER][REQUESTFAILED] ${req.url()} [${req.failure().errorText}]`));

  console.log(`[INFO] Navigating to ${FACEBOOK_URL}`);
  await page.goto(FACEBOOK_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Можна додати скрін для дебага
  await page.screenshot({ path: "screenshot.png" });

  // Для прикладу просто повернемо HTML (можна видалити)
  const html = await page.content();

  await browser.close();

  return html;
}

// === ENDPOINT для Railway ===
app.get("/scrape", async (req, res) => {
  try {
    const data = await scrapeFacebookAdsLibrary();
    res.send(data);
  } catch (err) {
    console.error(`[ERROR] ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[INFO] Server running on port ${PORT}`);
});
