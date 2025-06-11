import express from "express";
import { chromium } from "playwright";
import fs from "fs/promises";

const app = express();
const PORT = process.env.PORT || 8080;

// ТВОЯ ПРОКСІ (http, формат user:pass@host:port)
const proxy = "http://yEwHxb91:MLpy9sXG@156.246.130.157:64768";

// ТВОЇ КУКІ (можна через JSON, main domain - .facebook.com)
const cookies = [
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

// Юзер-агент
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.128 Safari/537.36";

// Додаємо debug-лог файли
async function saveScreenshot(page, name = "debug.png") {
  try {
    await page.screenshot({ path: name, fullPage: true });
  } catch (e) { /* ignore */ }
}
async function saveHTML(page, name = "debug.html") {
  try {
    const html = await page.content();
    await fs.writeFile(name, html, "utf-8");
  } catch (e) { /* ignore */ }
}

app.get("/scrape", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing url param" });

  let browser, page;
  let logs = [];
  let redirects = [];
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        `--proxy-server=${proxy}`,
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const context = await browser.newContext({
      userAgent: USER_AGENT,
      ignoreHTTPSErrors: true,
    });

    // Кукі
    await context.addCookies(cookies);

    page = await context.newPage();

    // Консоль лог
    page.on("console", msg => {
      logs.push({ type: msg.type(), text: msg.text() });
    });
    // Редіректи
    page.on('request', request => {
      if (["document"].includes(request.resourceType()) && request.redirectedFrom()) {
        redirects.push({
          from: request.redirectedFrom().url(),
          to: request.url()
        });
      }
    });

    // Навігація
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });

    // Автоскрол (довантаження динаміки)
    await autoScroll(page, 2500);

    // Скрин та HTML для дебагу
    await saveScreenshot(page, "debug.png");
    await saveHTML(page, "debug.html");

    // Витяг mp4-лінків
    const mp4_links = await page.evaluate(() => {
      // MP4 з відео-тегів
      const links = [];
      document.querySelectorAll("video source").forEach(s => {
        if (s.src && s.src.includes(".mp4")) links.push(s.src);
      });
      // MP4 просто з src
      document.querySelectorAll("video").forEach(v => {
        if (v.src && v.src.includes(".mp4")) links.push(v.src);
      });
      // MP4 з посилань на fbcdn
      document.querySelectorAll("a").forEach(a => {
        if (a.href && a.href.includes(".mp4")) links.push(a.href);
      });
      return Array.from(new Set(links));
    });

    res.json({
      status: "ok",
      url,
      mp4_links,
      logs,
      redirects,
      debug: "debug.png",
      html: "debug.html"
    });
  } catch (error) {
    if (page) {
      await saveScreenshot(page, "error.png");
      await saveHTML(page, "error.html");
    }
    res.status(500).json({
      status: "error",
      error: error.message,
      logs,
      redirects,
      debug: "error.png",
      html: "error.html"
    });
  } finally {
    if (browser) await browser.close();
  }
});

// Автоскрол
async function autoScroll(page, time = 2000) {
  await page.evaluate(async (scrollDelay) => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 600;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight > document.body.scrollHeight || totalHeight > 50000) {
          clearInterval(timer);
          resolve();
        }
      }, 250);
      setTimeout(() => {
        clearInterval(timer);
        resolve();
      }, scrollDelay);
    });
  }, time);
}

app.listen(PORT, () => console.log("Playwright bot running at port " + PORT));
