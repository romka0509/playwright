const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json());

const FB_COOKIES = [
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

app.get('/scrape', async (req, res) => {
  const url = req.query.url || 'https://www.facebook.com/ads/library/?active_status=active';

  // HTTP проксі (без socks5!)
  const proxy = {
    server: 'http://156.246.130.157:64768',
    username: 'yEwHxb91',
    password: 'MLpy9sXG'
  };

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      proxy
    });

    const context = await browser.newContext();
    await context.addCookies(FB_COOKIES);

    const page = await context.newPage();

    await page.goto(url, { timeout: 45000, waitUntil: 'domcontentloaded' });

    // Далі твоя логіка (наприклад, скриншот чи html)
    const html = await page.content();
    await browser.close();
    res.send({ html });
  } catch (error) {
    if (browser) await browser.close();
    res.status(500).send({ error: error.message, stack: error.stack });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
