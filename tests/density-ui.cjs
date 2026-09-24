const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '../dist');
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type }); res.end(data);
  });
});

(async () => {
  const output = process.env.UI_OUTPUT_DIR || path.join(__dirname, '../.expo/density');
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];
  try {
    for (const width of [320, 390, 600, 768, 1024]) {
      const height = width === 320 ? 640 : width === 390 ? 844 : 1024;
      const context = await browser.newContext({ viewport: { width, height } });
      await context.addInitScript(() => {
        localStorage.setItem('auth_token', 'density-test');
        localStorage.setItem('theme', 'dark');
        window.open = url => { window.__openedURL = url; return null; };
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let longContent = false;
      await context.route('https://www.myaiassistantapp.se/**', async route => {
        const pathname = new URL(route.request().url()).pathname;
        const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
        if (route.request().method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
        const bot = { id: 7, name: longContent ? 'An assistant with a long name that must remain readable on a small screen' : 'Travel guide', description: longContent ? 'A detailed description of the assistant and its purpose. '.repeat(8) : 'Plan your next trip', personality: 'Helpful', category: 'travel', avatar_icon: 'book', created_at: '2026-09-22T12:00:00Z' };
        let data;
        if (pathname.endsWith('/api/me/')) data = { username: longContent ? 'A very long display name for layout verification' : 'Demo', email: longContent ? 'long.email.address.for.layout.verification@example.test' : 'demo@example.test', plan: 'pro' };
        else if (pathname.endsWith('/api/bots/')) data = [bot, { ...bot, id: 8, name: 'Second assistant' }];
        else if (pathname.endsWith('/api/dashboard/')) data = { current_plan: 'pro', message_count: 12, message_limit: 10000, bot_count: 2, bot_limit: 10, knowledge_used_display: '0.02 MB', knowledge_limit_display: '500 MB' };
        else if (pathname.endsWith('/api/analytics/')) data = { bot_data: { labels: ['Travel guide', 'Second assistant'], counts: [2, 3] }, time_data: { labels: ['2026-09-22', '2026-09-23'], counts: [2, 3] } };
        else if (pathname.endsWith('/api/conversations/')) data = [{ conversation_id: 'density-chat', bot_id: 7, bot_name: 'Travel guide', title: 'Weekend in Stockholm', message_count: 2, updated_at: '2026-09-22T12:00:00Z' }];
        else if (pathname.endsWith('/knowledge/')) data = { files: [{ id: 1, name: 'Travel information with a long filename.pdf' }] };
        else throw new Error('Unexpected request ' + pathname);
        await route.fulfill({ headers, contentType: 'application/json', body: JSON.stringify(data) });
      });
      const origin = `http://127.0.0.1:${server.address().port}`;
      async function home() { await page.goto(origin); await page.getByText('2 assistants', { exact: true }).waitFor(); }
      async function checkScreen(name) {
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} horizontal page overflow at ${width}`);
        const outside = await page.locator('[role="button"], input, textarea').evaluateAll(elements => elements.filter(el => {
          if (!el.getClientRects().length) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
        }).map(el => el.getAttribute('aria-label') || el.textContent));
        assert.deepEqual(outside, [], `${name} clipped controls at ${width}`);
        await page.screenshot({ path: path.join(output, `${name}-${width}.png`) });
      }
      await home();
      const heading = await page.getByText('My Assistants', { exact: true }).boundingBox();
      const chat = await page.getByRole('button', { name: 'Open Chat', exact: true }).first().boundingBox();
      const nav1 = await page.getByRole('button', { name: 'Dashboard', exact: true }).boundingBox();
      const nav2 = await page.getByRole('button', { name: 'Analytics', exact: true }).boundingBox();
      const edit = await page.getByRole('button', { name: 'Edit', exact: true }).first().boundingBox();
      assert.ok(heading.y < 310, `Assistants too far down: ${heading.y}`);
      assert.ok(chat.y + chat.height <= height, `First assistant actions below the first screen at ${width}`);
      assert.ok(Math.abs(nav1.y - nav2.y) <= 1 && nav2.x > nav1.x, 'Navigation must have two columns');
      assert.ok(Math.abs(chat.y - edit.y) <= 1 && edit.x > chat.x, 'Assistant actions must have two columns');
      assert.ok(nav1.height >= 48 && chat.height >= 48, 'Keep accessible touch targets');
      results.push({ width, height, assistantsTop: heading.y, firstChatBottom: chat.y + chat.height });
      await checkScreen('home-dark');
      await page.getByRole('button', { name: 'Information Guide (PDF)', exact: true }).click();
      assert.equal(await page.evaluate(() => window.__openedURL), 'https://www.myaiassistantapp.se/static/pdf/ai_assistant_setup_guide_v2.pdf');
      await page.getByRole('button', { name: 'Discord Setup', exact: true }).first().click();
      assert.equal(await page.evaluate(() => window.__openedURL), 'https://www.myaiassistantapp.se/bots/7/discord/setup/');
      await page.getByRole('button', { name: 'Light theme', exact: true }).click();
      await checkScreen('home-light');
      await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
      for (const [button, ready, name] of [
        ['Dashboard', '12 / 10000 this month', 'dashboard'],
        ['Analytics', 'Messages by Assistant', 'analytics'],
        ['All conversations', 'Weekend in Stockholm', 'conversations'],
        ['Account & Help', 'Privacy & Support', 'account'],
        ['Knowledge Base', 'Uploaded Knowledge', 'knowledge'],
      ]) {
        await home();
        await page.getByRole('button', { name: button, exact: true }).first().click();
        await page.getByText(ready, { exact: true }).first().waitFor();
        await checkScreen(name);
      }
      await home();
      await page.getByText('+ Create', { exact: true }).click();
      await page.getByRole('textbox', { name: 'Assistant name', exact: true }).waitFor();
      await checkScreen('create');
      longContent = true;
      await home();
      await checkScreen('long-content');
      assert.deepEqual(errors, []);
      await context.close();
    }
    fs.writeFileSync(path.join(output, 'measurements.json'), JSON.stringify(results, null, 2));
    console.log('PASS density: 320/390/600/768/1024, compact Home/actions, main screens, light/dark, long content, guide/Discord handoffs; no page errors.');
    console.log(JSON.stringify(results));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
