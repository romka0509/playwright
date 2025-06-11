import express from "express";
import { chromium } from "playwright";

const app = express();
const PORT = process.env.PORT || 8080;

// === ТВОЇ ДАНІ ===
const FACEBOOK_COOKIES = [
  { name: "sb", value: "-0BBZpYRgKBE876qcOFcxqNT", domain: ".facebook.com", path: "/" },
  { name: "datr", value: "_EBBZpx3eWjjNfCuYsHeQXMT", domain: ".facebook.com", path: "/" },
  { name: "c_user", value: "100016128750721", domain: ".facebook.com", path: "/" },
  { name: "ps_l", value: "1", domain: ".facebook.com", path: "/" },
  { name: "ps_n", value: "1", domain: ".facebook.com", path: "/" },
  { name: "presence", value: 'C%7B%22t3%22%3A%5B%5D%2C%22utc3%22%3A1749331040651%2C%22v%22%3A1%7D', domain: ".facebook.com", path: "/" },
  { name: "wd", value: "1656x952", domain: ".facebook.com", path: "/" },
  { name: "fr", value: "1eVkqbkYKVQnHy4gA.AWe1qnlHPiXVwKrZFLCMMLp80qSNR_fWKHmsxiqtBHX1O150f2Y.BoSaPa..AAA.0.0.BoSaPa.AWcXzg5x-z316WUKCIijkjbIW6Q", domain: ".facebook.com", path: "/" },
  { name: "xs", value: "33%3AC6w1SSavbUF5cQ%3A2%3A1715552532%3A-1%3A-1%3A%3AAcWjLZrzqM2xtoKXUcrrRDWnDVkK_9Xaad9pnc7bFA", domain: ".facebook.com", path: "/" },
  { name: "alsfid", value: '{"id":"f20786144","timestamp":1749656552951.3}', domain: ".facebook.com", path: "/" }
];

// === ТВОЇ ПРОКСІ ===
const PROXY_SERVER = "http://yEwHxb91:MLpy9sXG@156.246.130.157:64768";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.128 Safari/537.36";

app.get("/scrape", async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) return res.status(400).json({ error: "No URL provided." });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      proxy: {
        server: PROXY_SERVER
      }
    });
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1400, height: 900 }
    });
    await context.addCookies(FACEBOOK_COOKIES);

    const page = await context.newPage();

    // Навігація з більшим таймаутом
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Дочекатись завантаження/авторизації (змінюй селектор під себе)
    await page.waitForTimeout(7000);

    // Витягуємо mp4 (fbcdn.net/*.mp4)
    const videoLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('video, source'))
        .map(el => el.src)
        .filter(src => src && src.includes(".fbcdn.net") && src.endsWith(".mp4"));
    });

    res.json({
      status: "ok",
      url: targetUrl,
      mp4_links: videoLinks
    });

    await browser.close();
  } catch (err) {
    if (browser) await browser.close();
    res.json({ status: "error", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
