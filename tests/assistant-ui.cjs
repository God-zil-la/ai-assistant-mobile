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
    res.writeHead(200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream' }).end(data);
  });
});

(async () => {
  fs.mkdirSync(path.join(__dirname, '../.expo'), { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    let bot = null;
    let creates = 0;
    let updates = 0;
    let rejectName = false;
    await context.route('https://www.myaiassistantapp.se/**', async route => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
      if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
      let status = 200;
      let data;
      if (pathname.endsWith('/api/me/')) data = { username: 'U1 tester', email: 'u1@example.test', plan: 'premium' };
      else if (pathname.endsWith('/api/bots/')) {
        if (request.method() === 'POST') {
          creates++;
          bot = { id: 9, ...request.postDataJSON() };
          status = 201;
          data = bot;
        } else data = bot ? [bot] : [];
      } else if (pathname.endsWith('/api/bots/9/')) {
        updates++;
        if (rejectName) { status = 400; data = { name: ['You already have a bot with this name. Please choose a different name.'] }; }
        else { bot = { ...bot, ...request.postDataJSON() }; data = bot; }
      } else throw new Error(`Unexpected route: ${pathname}`);
      await route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(data) });
    });
    await context.addInitScript(() => localStorage.setItem('auth_token', 'u1-mock-token'));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByText('Signed in as U1 tester').waitFor();
    await page.getByText('+ Create', { exact: true }).click();
    await page.getByText('Create Assistant', { exact: true }).last().click();
    await page.getByText('Name: Please enter a name for your assistant.', { exact: true }).waitFor();
    assert.equal(creates, 0);
    await page.getByRole('textbox', { name: 'Assistant name', exact: true }).fill(' U1 guide ');
    await page.getByRole('textbox', { name: 'Personality & instructions', exact: true }).fill(' ');
    await page.getByText('Create Assistant', { exact: true }).last().click();
    await page.getByText('Personality & instructions: Please enter personality and instructions for your assistant.', { exact: true }).waitFor();
    assert.equal(creates, 0);
    await page.getByRole('textbox', { name: 'Description', exact: true }).fill(' Family travel ');
    await page.getByRole('textbox', { name: 'Personality & instructions', exact: true }).fill(' Ask about the budget first. ');
    for (const [label, choice] of [['response tone', 'Professional'], ['response length', 'Detailed'], ['assistant icon', '📚 Books']]) {
      await page.getByRole('button', { name: `Choose ${label}`, exact: true }).click();
      await page.getByRole('button', { name: choice, exact: true }).click();
      await page.getByRole('button', { name: choice, exact: true }).waitFor({ state: 'hidden' });
      await page.locator('[aria-modal="true"]').waitFor({ state: 'hidden' });
    }
    await page.getByText('Create Assistant', { exact: true }).last().click();
    await page.getByText('Signed in as U1 tester').waitFor();
    assert.equal(creates, 1);
    assert.deepEqual(bot, { id: 9, name: 'U1 guide', description: 'Family travel', personality: 'Ask about the budget first.', category: 'general', response_tone: 'professional', response_length: 'detailed', avatar_icon: 'book' });
    await page.getByText('📚 U1 guide', { exact: true }).waitFor();
    await page.getByRole('button', { name: /Edit Assistant$/ }).click();
    assert.equal(await page.getByRole('textbox', { name: 'Personality & instructions', exact: true }).inputValue(), bot.personality);
    for (const text of ['Professional', 'Detailed', '📚 Books']) await page.getByText(text, { exact: true }).waitFor();
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await page.getByRole('button', { name: 'Choose response tone', exact: true }).scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(__dirname, `../.expo/u1-preferences-${width}.png`) });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
    await page.screenshot({ path: path.join(__dirname, '../.expo/u1-preferences-dark.png') });
    rejectName = true;
    await page.getByRole('textbox', { name: 'Assistant name', exact: true }).fill('Duplicate');
    await page.getByText('Save Changes', { exact: true }).click();
    await page.getByText('Name: You already have a bot with this name. Please choose a different name.', { exact: true }).waitFor();
    assert.equal(bot.name, 'U1 guide');
    assert.equal(await page.getByRole('textbox', { name: 'Assistant name', exact: true }).inputValue(), 'Duplicate');
    for (const text of ['Professional', 'Detailed', '📚 Books']) await page.getByText(text, { exact: true }).waitFor();
    rejectName = false;
    await page.getByRole('textbox', { name: 'Assistant name', exact: true }).fill('U1 guide');
    for (const [label, choice] of [['response tone', 'Use personality & instructions'], ['response length', 'Use personality & instructions'], ['assistant icon', 'None (current appearance)']]) {
      await page.getByRole('button', { name: `Choose ${label}`, exact: true }).click();
      await page.getByRole('button', { name: choice, exact: true }).click();
      await page.getByRole('button', { name: choice, exact: true }).waitFor({ state: 'hidden' });
      await page.locator('[aria-modal="true"]').waitFor({ state: 'hidden' });
    }
    await page.getByRole('textbox', { name: 'Description', exact: true }).click();
    await page.getByRole('textbox', { name: 'Description', exact: true }).press('ControlOrMeta+A');
    await page.getByRole('textbox', { name: 'Description', exact: true }).press('Backspace');
    assert.equal(await page.getByRole('textbox', { name: 'Description', exact: true }).inputValue(), '');
    await page.getByText('Save Changes', { exact: true }).click();
    await page.getByText('Signed in as U1 tester').waitFor();
    assert.equal(updates, 2);
    assert.equal(bot.description, '');
    assert.equal(bot.response_tone, 'default');
    assert.equal(bot.response_length, 'default');
    assert.equal(bot.avatar_icon, 'default');
    await page.getByRole('button', { name: /Edit Assistant$/ }).click();
    await page.getByRole('button', { name: 'Choose response tone', exact: true }).click();
    await page.getByRole('button', { name: 'Friendly', exact: true }).click();
    await page.locator('[aria-modal="true"]').waitFor({ state: 'hidden' });
    await page.getByText('Cancel', { exact: true }).click();
    await page.getByText('Signed in as U1 tester').waitFor();
    assert.equal(updates, 2);
    await page.getByRole('button', { name: /Edit Assistant$/ }).click();
    assert.equal(await page.getByRole('button', { name: 'Choose response tone', exact: true }).innerText(), 'Use personality & instructions');
    assert.deepEqual(pageErrors, []);
    console.log('PASS U1: create, required-field errors, preference/icon save and reload, duplicate API field error with retained input, reset to defaults, clear description, cancel, 320/390/1280 widths, light/dark; no page errors.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
