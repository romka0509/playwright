const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json());

app.get('/scrape', async (req, res) => {
  const proxy = 'socks5://yEwHxb91:MLpy9sXG@156.246.130.157:64768';
  const fbUrl = req.query.url || 'https://www.facebook.com/ads/library/?active_status=active';

  const cookies = [
    { name: 'sb', value: '-0BBZpYRgKBE876qcOFcxqNT', domain: '.facebook.com', path: '/' },
    { name: 'datr', value: '_EBBZpx3eWjjNfCuYsHeQXMT', domain: '.facebook.com', path: '/' },
    { name: 'c_user', value: '100016128750721', domain: '.facebook.com', path: '/' },
    { name: 'ps_l', value: '1', domain: '.facebook.com', path: '/' },
    { name: 'ps_n', value: '1', domain: '.facebook.com', path: '/' },
    { name: 'presence', value: 'C%7B%22t3%22%3A%5B%5D%2C%22utc3%22%3A1749331040651%2C%22v%22%3A1%7D', domain: '.facebook.com', path: '/' },
    { name: 'fr', value: '1eVkqbkYKVQnHy4gA.AWe1qnlHPiXVwKrZFLCMMLp80qSNR_fWKHmsxiqtBHX1O150f2Y.BoSaPa..AAA.0.0.BoSaPa.AWcXzg5x-z316WUKCIijkjbIW6Q', domain: '.facebook.com', path: '/' },
    { name: 'xs', value: '33%3AC6w1SSavbUF5cQ%3A2%3A1715552532%3A-1%3A-1%3A%3AAcWjLZrzqM2xtoKXUcrrRDWnDVkK_9Xaad9pnc7bFA', domain: '.facebook.com', path: '/' },
    { name: 'alsfid', value: '{"id":"f20786144","timestamp":1749656552951.3}', domain: '.facebook.com', path: '/' },
    // додати інші кукі якщо потрібно
  ];

  const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
  const contextOptions = {
    proxy: { server: proxy },
    userAgent,
    locale: 'en-US',
    viewport: { width: 1280, height: 800 },
    bypassCSP: true,
    ignoreHTTPSErrors: true,
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext(contextOptions);
    await context.addCookies(cookies);
    const page = await context.newPage();

    await page.goto(fbUrl, { timeout: 60000, waitUntil: 'domcontentloaded' });
    // Далі твоя логіка

    res.json({ success: true, message: "Page loaded" });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
