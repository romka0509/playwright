const express = require('express');
const { chromium } = require('playwright');
const app = express();
const PORT = process.env.PORT || 8080;

// === ЗАМІНИ на свої ===
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
// === ПРОКСІ (http://user:pass@ip:port)
const PROXY = 'http://yEwHxb91:MLpy9sXG@156.246.130.157:64768';

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: 'Missing url param' });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      proxy: {
        server: PROXY
      }
    });
    const context = await browser.newContext();
    await context.addCookies(FB_COOKIES);

    const page = await context.newPage();

    // Ловимо всі mp4-посилання
    const mp4Links = [];
    page.on('request', request => {
      const reqUrl = request.url();
      if (reqUrl.includes('.mp4') && !mp4Links.includes(reqUrl)) {
        mp4Links.push(reqUrl);
      }
    });

   await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
console.log(await page.content()); // або збережи у файл

    // Автоскрол (імітація користувача, щоб підгрузились всі креативи)
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(1200);
    }
    // Ще трохи зачекати
    await page.waitForTimeout(3000);

    await browser.close();
    res.json({
      status: 'ok',
      url,
      mp4_links: mp4Links
    });
  } catch (e) {
    if (browser) await browser.close();
    res.json({ error: e.message || e.toString() });
  }
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
