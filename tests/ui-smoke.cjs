const { Buffer } = require('node:buffer');
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

if (process.argv.includes('--knowledge')) {
  require('./knowledge-ui.cjs');
} else (async () => {
  fs.mkdirSync(path.join(__dirname, '../.expo'), { recursive: true });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let failMe = false;
    let knowledge = [{ id: 1, name: 'Existing.txt' }];
    let uploadMode = 'success';
    let failHistory = false;
    let chatCalls = 0;
    let chatMode = 'historyFailure';
    let analyticsData = { bot_data: { labels: ['Travel guide', 'Second assistant'], counts: [2, 3] }, time_data: { labels: ['2026-09-17', '2026-09-18'], counts: [0, 5] } };
    const bot = { id: 7, name: 'Travel guide', description: 'Plan your next trip', personality: 'Helpful', category: 'travel', avatar_icon: 'book' };
    const conversation = { conversation_id: 'abc', bot_id: 7, bot_name: bot.name, bot_avatar_icon: 'book', title: 'Weekend in Stockholm', message_count: 2,
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
      } else if (pathname.endsWith('/api/dashboard/')) data = { current_plan: 'premium', message_count: 12, message_limit: 3000, bot_count: 1, bot_limit: 5, knowledge_used_display: '0.02 MB', knowledge_limit_display: '250 MB' };
      else if (pathname.endsWith('/api/analytics/')) data = analyticsData;
      else if (pathname.endsWith('/knowledge/')) {
        if (request.method() === 'POST') {
          assert.match(request.headers()['content-type'], /multipart\/form-data; boundary=/);
          if (uploadMode === 'uncertain') { await route.abort('internetdisconnected'); return; }
          if (uploadMode === 'quota') { status = 403; data = { error: 'Knowledge storage limit reached.', code: 'knowledge_quota_exceeded', plan: 'premium' }; }
          else { const item = { id: 2, name: 'uploaded.txt' }; knowledge.push(item); status = 201; data = item; }
        } else data = { files: knowledge };
      } else if (pathname.endsWith('/knowledge/2/')) { knowledge = knowledge.filter(item => item.id !== 2); await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } }); return; }
      else if (pathname.endsWith('/api/bots/')) data = [bot];
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
    await page.getByText('+ Create', { exact: true }).click();
    await page.getByText('Describe what your assistant helps with', { exact: false }).waitFor();
    await page.getByText('Describe its tone, response style', { exact: false }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: 'Personality & instructions', exact: true }).inputValue(), 'I am a helpful and friendly assistant.');
    await page.screenshot({ path: path.join(__dirname, '../.expo/u1-create.png'), fullPage: true });
    await page.getByText('Cancel', { exact: true }).click();
    await page.getByText('Signed in as Demo').waitFor();
    await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
    assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'dark');
    await page.reload();
    await page.getByRole('button', { name: 'Light theme', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
    await page.getByText('12 / 3000 this month').waitFor();
    await page.screenshot({ path: path.join(__dirname, '../.expo/dashboard-dark.png'), fullPage: true });
    await page.getByRole('button', { name: 'Light theme', exact: true }).click();
    await page.screenshot({ path: path.join(__dirname, '../.expo/dashboard-light.png'), fullPage: true });
    await page.getByRole('button', { name: 'Analytics', exact: true }).click();
    await page.getByText('Messages by Assistant', { exact: true }).waitFor();
    await page.getByText('Messages Over Time', { exact: true }).waitFor();
    assert.equal(await page.getByText('Message Count: 5', { exact: true }).count(), 2);
    for (const viewport of [{ width: 320, height: 640 }, { width: 360, height: 800 }, { width: 393, height: 852 }, { width: 768, height: 1024 }, { width: 1000, height: 700 }]) {
      await page.setViewportSize(viewport);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      for (const label of analyticsData.time_data.labels) {
        assert.ok(await page.getByText(label, { exact: true }).evaluate(element =>
          getComputedStyle(element).whiteSpace === 'nowrap' && element.scrollWidth <= element.clientWidth));
      }
      await page.screenshot({ path: path.join(__dirname, `../.expo/analytics-${viewport.width}.png`), fullPage: true });
    }
    for (const dataset of [{ labels: ['2026-09-18'], counts: [0] }, { labels: [], counts: [] }]) {
      analyticsData = { bot_data: dataset, time_data: dataset };
      await page.goto(origin);
      await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
      await page.getByRole('button', { name: 'Analytics', exact: true }).click();
      await page.getByText('Message Count: 0', { exact: true }).first().waitFor();
      assert.equal(await page.getByText('Message Count: 0', { exact: true }).count(), 2);
      if (!dataset.labels.length) assert.equal(await page.getByText('No messages yet.', { exact: true }).count(), 2);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin);
    await page.getByRole('button', { name: /Knowledge Base$/ }).click();
    await page.getByText('Existing.txt', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'What is Knowledge?', exact: true }).click();
    await page.getByText('Simple example', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Got it', exact: true }).click();
    await page.getByRole('button', { name: 'Got it', exact: true }).waitFor({ state: 'hidden' });
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Choose document', exact: true }).click();
    await (await chooser).setFiles({ name: 'uploaded.txt', mimeType: 'text/plain', buffer: Buffer.from('Existing feature test') });
    await page.getByRole('button', { name: 'Upload Knowledge', exact: true }).click();
    await page.getByText('Knowledge uploaded and processed successfully!', { exact: true }).waitFor();
    assert.equal(knowledge.length, 2);
    await page.screenshot({ path: path.join(__dirname, '../.expo/knowledge-light.png'), fullPage: true });
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete uploaded.txt', exact: true }).click();
    await page.getByText('Knowledge deleted successfully.', { exact: true }).waitFor();
    assert.equal(knowledge.length, 1);
    const secondChooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Choose document', exact: true }).click();
    await (await secondChooser).setFiles({ name: 'retry.txt', mimeType: 'text/plain', buffer: Buffer.from('Retry test') });
    uploadMode = 'uncertain';
    await page.getByRole('button', { name: 'Upload Knowledge', exact: true }).click();
    await page.getByText('Upload could not be confirmed.', { exact: false }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Upload Knowledge', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: 'Refresh file list', exact: true }).click();
    await page.getByText('Existing.txt', { exact: true }).waitFor();
    uploadMode = 'quota';
    await page.getByRole('button', { name: 'Upload Knowledge', exact: true }).click();
    await page.getByText('Knowledge storage limit reached for your premium plan.', { exact: false }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('auth_token')), 'mock-token');
    await page.goto(origin);
    await page.getByRole('button', { name: /Edit Assistant$/ }).click();
    await page.getByText('Describe what your assistant helps with', { exact: false }).waitFor();
    await page.getByText('Describe its tone, response style', { exact: false }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: 'Description', exact: true }).inputValue(), bot.description);
    assert.equal(await page.getByRole('textbox', { name: 'Personality & instructions', exact: true }).inputValue(), bot.personality);
    await page.getByRole('textbox', { name: 'Personality & instructions', exact: true }).fill('Be concise. Ask about the budget first.');
    await page.screenshot({ path: path.join(__dirname, '../.expo/u1-edit.png'), fullPage: true });
    await page.getByRole('button', { name: 'Choose category, currently Travel' }).click();
    await page.getByRole('textbox', { name: 'Search categories' }).fill('tech');
    await page.getByRole('button', { name: 'Technology', exact: true }).click();
    await page.getByText('Save Changes', { exact: true }).click();
    await page.getByText('Signed in as Demo').waitFor();
    assert.equal(bot.category, 'technology');
    assert.equal(bot.personality, 'Be concise. Ask about the budget first.');
    assert.equal(bot.description, 'Plan your next trip');
    await page.getByRole('button', { name: 'All conversations', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search conversations' }).fill('unmatched');
    await page.getByText('No matching conversations.').waitFor();
    await page.getByRole('textbox', { name: 'Search conversations' }).fill('stockholm');
    await page.getByRole('button', { name: 'Open Weekend in Stockholm' }).click();
    await page.getByText('Explore the old town and waterfront.').waitFor();
    await page.getByText('📚 Travel guide', { exact: true }).last().waitFor();
    await page.setViewportSize({ width: 390, height: 400 });
    await page.waitForFunction(([last, input, send]) => {
      const message = last.getBoundingClientRect();
      const composer = input.getBoundingClientRect();
      const button = send.getBoundingClientRect();
      return message.top >= 64 && message.bottom <= composer.top && button.bottom <= window.innerHeight;
    }, [await page.getByText('Explore the old town and waterfront.').elementHandle(),
      await page.getByRole('textbox', { name: 'Message your assistant' }).elementHandle(),
      await page.getByRole('button', { name: 'Send', exact: true }).elementHandle()]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Rename', exact: true }).click();
    await page.getByRole('textbox', { name: 'Conversation title', exact: true }).fill('Autumn trip');
    await page.getByRole('button', { name: 'Save title' }).click();
    await page.getByText('Conversation renamed.').waitFor();
    assert.equal(conversation.title, 'Autumn trip');
    await page.screenshot({ path: path.join(__dirname, '../.expo/chat-preview.png') });
    const languageHint = page.getByText(/You can chat in many languages\s*-\s*just\s*write in the language you prefer\./);
    assert.equal(await languageHint.count(), 0); // edd9163: hide in existing history.
    const reopenChat = async () => {
      await page.goto(origin);
      await page.getByRole('button', { name: 'All conversations', exact: true }).click();
      await page.getByRole('button', { name: 'Open Autumn trip', exact: true }).click();
    };
    const savedMessages = conversation.messages;
    conversation.messages = [];
    await reopenChat();
    await languageHint.waitFor();
    conversation.messages = savedMessages;
    await reopenChat();
    await page.getByText('Explore the old town and waterfront.').waitFor();
    assert.equal(await languageHint.count(), 0);
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
    // Finish Home's session refresh before simulating expiry on Account.
    await page.waitForLoadState('networkidle');
    failMe = 401;
    await page.getByRole('button', { name: 'Account & Help', exact: true }).click();
    await page.getByText('Welcome Back', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('auth_token')), null);
    assert.deepEqual(errors, []);
    console.log('PASS: persisted theme, dashboard, two analytics charts, four viewport widths, knowledge help/upload/delete/uncertain recovery/quota, category edit, return navigation, global history, search, rename, confirmed-send/history-failure recovery, uncertain-send draft recovery, quota preservation, account UI, offline session retry, expired-session sign-out; no page errors.');
  } finally { await browser.close(); server.close(); }
})().catch((error) => { console.error(error); server.close(); process.exitCode = 1; });
