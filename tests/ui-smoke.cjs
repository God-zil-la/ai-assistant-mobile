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
  fs.mkdirSync(path.join(__dirname, '../.expo'), { recursive: true });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let failMe = false;
    let failHistory = false;
    let chatCalls = 0;
    let chatMode = 'historyFailure';
    const bot = { id: 7, name: 'Travel guide', description: 'Plan your next trip', personality: 'Helpful', category: 'travel' };
    const conversation = { conversation_id: 'abc', bot_id: 7, bot_name: bot.name, title: 'Weekend in Stockholm', message_count: 2,
      updated_at: '2026-09-17T12:00:00Z', messages: [
        { id: 1, sender: 'user', message: 'Where should I go?', timestamp: '2026-09-17T12:00:00Z' },
        { id: 2, sender: 'bot', message: 'Explore the old town and waterfront.', timestamp: '2026-09-17T12:00:01Z' },
      ] };
    await context.route('https://www.myaiassistantapp.se/**', async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' } }); return; }
      let data;
      let status = 200;
      if (pathname.endsWith('/api/me/')) {
        if (failMe === true) { await route.abort('internetdisconnected'); return; }
        if (failMe === 401) { status = 401; data = { detail: 'Invalid token' }; }
        else data = { username: 'Demo', email: 'demo@example.test', plan: 'premium' };
      } else if (pathname.endsWith('/api/bots/')) data = [bot];
      else if (pathname.endsWith('/api/bots/7/')) { Object.assign(bot, request.postDataJSON()); data = bot; }
      else if (pathname.endsWith('/api/conversations/')) data = [conversation];
      else if (pathname.endsWith('/api/conversations/abc/')) {
        if (request.method() === 'PATCH') { conversation.title = request.postDataJSON().title; }
        if (failHistory && request.method() === 'GET') { status = 503; data = { detail: 'Unavailable' }; }
        else data = conversation;
      } else if (pathname.endsWith('/chat/')) {
        chatCalls++;
        if (chatMode === 'uncertain') { await route.abort('internetdisconnected'); return; }
        if (chatMode === 'quota') {
          await route.fulfill({ status: 403, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Monthly limit reached' }) });
          return;
        }
        failHistory = true;
        data = { response: 'Saved reply' };
      } else { throw new Error('Unexpected API route: ' + pathname); }
      await route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(data) });
    });
    await context.addInitScript(() => { localStorage.setItem('auth_token', 'mock-token'); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.goto(origin);
    await page.getByText('Signed in as Demo').waitFor();
    await page.getByText('Edit', { exact: true }).click();
    await page.getByRole('button', { name: 'Choose category, currently Travel' }).click();
    await page.getByRole('textbox', { name: 'Search categories' }).fill('tech');
    await page.getByRole('button', { name: 'Technology', exact: true }).click();
    await page.getByText('Save Changes', { exact: true }).click();
    await page.getByText('Signed in as Demo').waitFor();
    assert.equal(bot.category, 'technology');
    await page.getByRole('button', { name: 'All conversations', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search conversations' }).fill('unmatched');
    await page.getByText('No matching conversations.').waitFor();
    await page.getByRole('textbox', { name: 'Search conversations' }).fill('stockholm');
    await page.getByRole('button', { name: 'Open Weekend in Stockholm' }).click();
    await page.getByText('Explore the old town and waterfront.').waitFor();
    await page.getByRole('button', { name: 'Rename', exact: true }).click();
    await page.getByRole('textbox', { name: 'Conversation title', exact: true }).fill('Autumn trip');
    await page.getByRole('button', { name: 'Save title' }).click();
    await page.getByText('Conversation renamed.').waitFor();
    assert.equal(conversation.title, 'Autumn trip');
    await page.screenshot({ path: path.join(__dirname, '../.expo/chat-preview.png') });
    await page.getByRole('textbox', { name: 'Message your assistant' }).fill('Hello again');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByText('Message sent, but the updated history could not be loaded.', { exact: false }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: 'Message your assistant' }).inputValue(), '');
    assert.equal(chatCalls, 1);
    failHistory = false;
    await page.getByRole('button', { name: 'Refresh chat' }).click();
    await page.getByText('Explore the old town and waterfront.').waitFor();
    chatMode = 'uncertain';
    await page.getByRole('textbox', { name: 'Message your assistant' }).fill('Keep this draft');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByText('Delivery could not be confirmed.', { exact: false }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: 'Message your assistant' }).inputValue(), 'Keep this draft');
    assert.equal(await page.getByRole('button', { name: 'Send', exact: true }).isDisabled(), true);
    failHistory = false;
    await page.getByRole('button', { name: 'Refresh chat' }).click();
    await page.getByText('Explore the old town and waterfront.').waitFor();
    chatMode = 'quota';
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByText('Monthly limit reached', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('auth_token')), 'mock-token');
    failHistory = false;
    await page.getByRole('button', { name: 'Refresh chat' }).click();
    await page.getByText('Explore the old town and waterfront.').waitFor();
    assert.equal(chatCalls, 3);
    await page.goto(origin);
    await page.getByRole('button', { name: 'Account & Help', exact: true }).click();
    await page.getByText('demo@example.test', { exact: true }).last().waitFor();
    await page.getByRole('button', { name: 'Continue to account deletion' }).waitFor();
    await page.screenshot({ path: path.join(__dirname, '../.expo/account-preview.png'), fullPage: true });
    failMe = true;
    await page.goto(origin);
    await page.getByText('Your saved sign-in has been kept on this device.').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('auth_token')), 'mock-token');
    failMe = false;
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await page.getByText('Signed in as Demo').waitFor();
    failMe = 401;
    await page.getByRole('button', { name: 'Account & Help', exact: true }).click();
    await page.getByText('Welcome Back', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('auth_token')), null);
    assert.deepEqual(errors, []);
    console.log('PASS: category edit, return navigation, global history, search, rename, confirmed-send/history-failure recovery, uncertain-send draft recovery, quota preservation, account UI, offline session retry, expired-session sign-out; no page errors.');
  } finally { await browser.close(); server.close(); }
})().catch((error) => { console.error(error); server.close(); process.exitCode = 1; });
