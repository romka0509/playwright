import express from 'express';
import { chromium } from 'playwright';

const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter.' });
  }

  // ==== ТВОЇ ДАНІ ДЛЯ ПРОКСІ ====
  const proxyHost = '156.246.130.157';
  const proxyPort = '64768';
  const proxyUser = 'yEwHxb91';
  const proxyPass = 'MLpy9sXG';

  // ==== ТВОЇ КУКІ ====
  const cookies = [
    { name: "sb", value: "-0BBZpYRgKBE876qcOFcxqNT", domain: ".facebook.com", path: "/" },
    { name: "datr", value: "_EBBZpx3eWjjNfCuYsHeQXMT", domain: ".facebook.com", path: "/" },
    { name: "c_user", value: "100016128750721", domain: ".facebook.com", path: "/" },
    { name: "ps_l", value: "1", domain: ".facebook.com", path: "/" },
    { name: "ps_n", value: "1", domain: ".facebook.com", path: "/" },
    { name: "presence", value: "C%7B%22t3%22%3A%5B%5D%2C%22utc3%22%3A1749331040651%2C%22v%22%3A1%7D", domain: ".facebook.com", path: "/" },
    { name: "wd", value: "1656x952", domain: ".facebook.com", path: "/" },
    { name: "fr", value: "1eVkqbkYKVQnHy4gA.AWe1qnlHPiXVwKrZFLCMMLp80qSNR_fWKHmsxiqtBHX1O150f2Y.BoSaPa..AAA.0.0.BoSaPa.AWcXzg5x-z316WUKCIijkjbIW6Q", domain: ".facebook.com", path: "/" },
    { name: "xs", value: "33%3AC6w1SSavbUF5cQ%3A2%3A1715552532%3A-1%3A-1%3A%3AAcWjLZrzqM2xtoKXUcrrRDWnDVkK_9Xaad9pnc7bFA", domain: ".facebook.com", path: "/" },
    { name: "alsfid", value: '{"id":"f20786144","timestamp":1749656552951.3}', domain: ".facebook.com", path: "/" }
  ];

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        `--proxy-server=http://${proxyHost}:${proxyPort}`,
        '--no-sandbox'
      ]
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.128 Safari/537.36"
    });

    // Авторизація на проксі
    await context.addInitScript(() => {
      window.__proxyUser = 'yEwHxb91';
      window.__proxyPass = 'MLpy9sXG';
    });

    // Додаємо кукі
    await context.addCookies(cookies);

    const page = await context.newPage();

    // Встановлюємо проксі-авторизацію (тільки для HTTP!)
    page.on('request', async (request) => {
      if (request.isNavigationRequest() && request.url().startsWith("http")) {
        await request.continue({
          headers: {
            ...request.headers(),
            'Proxy-Authorization': 'Basic ' + Buffer.from(`${proxyUser}:${proxyPass}`).toString('base64')
          }
        });
      } else {
        await request.continue();
      }
    });

    await page.route('**/*', route => route.continue());

    // Спроба перейти на сторінку
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Витягуємо mp4
    const mp4Links = await page.$$eval('video source[src$=".mp4"], video[src$=".mp4"]', elements =>
      Array.from(elements).map(el => el.src || el.getAttribute('src'))
    );

    res.json({ status: "ok", url, mp4_links: mp4Links });
    await browser.close();
  } catch (error) {
    if (browser) await browser.close();
    res.status(500).json({ status: "error", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
