const express = require('express');
const { chromium } = require('playwright');
const app = express();

app.use(express.json());

const PROXY = {
  server: 'http://156.246.130.157:64768',
  username: 'yEwHxb91',
  password: 'MLpy9sXG'
};

const COOKIES = [
  { name: 'sb', value: '-0BBZpYRgKBE876qcOFcxqNT', domain: '.facebook.com', path: '/' },
  { name: 'datr', value: '_EBBZpx3eWjjNfCuYsHeQXMT', domain: '.facebook.com', path: '/' },
  { name: 'c_user', value: '100016128750721', domain: '.facebook.com', path: '/' },
  { name: 'ps_l', value: '1', domain: '.facebook.com', path: '/' },
  { name: 'ps_n', value: '1', domain: '.facebook.com', path: '/' },
  { name: 'presence', value: 'C%7B%22t3%22%3A%5B%5D%2C%22utc3%22%3A1749331040651%2C%22v%22%3A1%7D', domain: '.facebook.com', path: '/' },
  { name: 'wd', value: '1656x952', domain: '.facebook.com', path: '/' },
  { name: 'fr', value: '1eVkqbkYKVQnHy4gA.AWe1qnlHPiXVwKrZFLCMMLp80qSNR_fWKHmsxiqtBHX1O150f2Y.BoSaPa..AAA.0.0.BoSaPa.AWcXzg5x-z316WUKCIijkjbIW6Q', domain: '.facebook.com', path: '/' },
  { name: 'xs', value: '33%3AC6w1SSavbUF5cQ%3A2%3A1715552532%3A-1%3A-1%3A%3AAcWjLZrzqM2xtoKXUcrrRDWnDVkK_9Xaad9pnc7bFA', domain: '.facebook.com', path: '/' },
  { name: 'alsfid', value: '{"id":"f20786144","timestamp":1749656552951.3}', domain: '.facebook.com', path: '/' }
];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      proxy: PROXY
    });
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 800 }
    });
    await context.addCookies(COOKIES);

    const page = await context.newPage();
    console.log('[INFO] Navigating:', url);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Витягуємо всі mp4-лінки з відео на сторінці:
    const mp4_links = await page.$$eval('video source', nodes =>
      nodes.map(n => n.src).filter(src => src && src.endsWith('.mp4'))
    );

    // Або, якщо потрібні всі відео в network:
    // const requests = [];
    // page.on('request', req => { if (req.url().endsWith('.mp4')) requests.push(req.url()); });

    // Додатково, якщо потрібно повний HTML:
    // const html = await page.content();

    await browser.close();

    res.json({
      status: 'ok',
      url,
      mp4_links
      // , html // якщо потрібно
    });
  } catch (e) {
    if (browser) await browser.close();
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
