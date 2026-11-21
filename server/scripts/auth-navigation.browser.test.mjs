import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { delimiter, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Uses a separately installed browser test tool, without changing application dependencies.
// npm exec supplies its temporary package directory through PATH.
const require = createRequire(import.meta.url);
const toolPath = process.env.QA_PLAYWRIGHT_MODULE || pathToFileURL(require.resolve('playwright', {
  paths: [dirname(fileURLToPath(import.meta.url)), ...(process.env.PATH || '').split(delimiter)],
})).href;
const tool = await import(toolPath);
const { chromium } = tool.default || tool;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const origin = process.env.QA_CLIENT_ORIGIN || 'http://localhost:3000';
test.after(() => browser.close());

async function createPage({ rejectSession = false } = {}) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const navigations = [];
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) navigations.push(new URL(frame.url()).pathname);
  });
  await page.route('**/api/auth/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let status = 200;
    let body;
    if (path.endsWith('/login')) body = { message: 'Login successful.', data: { accessToken: 'browser-test-token' } };
    else if (path.endsWith('/session')) {
      status = rejectSession ? 401 : 200;
      body = rejectSession ? { message: 'Invalid or expired access token.' }
        : { message: 'Session is valid.', data: { userId: 'browser-test-user', roleName: 'System Administrator' } };
    } else if (path.endsWith('/logout')) body = { message: 'Signed out successfully.' };
    else throw new Error(`Unexpected authentication request: ${path}`);
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto(`${origin}/login`);
  await page.locator('#email').fill('qa@example.org');
  await page.locator('#password').fill('browser-test-password');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  return { page, context, navigations };
}

test('a system administrator reaches the existing portal and logout stays on login', async () => {
  const { page, context, navigations } = await createPage();
  try {
    await page.waitForURL(`${origin}/portal`);
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.waitForURL(`${origin}/login`);
    await page.waitForTimeout(1500);
    assert.equal(new URL(page.url()).pathname, '/login');
    assert.ok(navigations.filter(path => path === '/portal').length <= 1,
      'logout must not reactivate cached login success and redirect back to the portal');
    assert.deepEqual(await page.evaluate(() => ({
      local: localStorage.getItem('tge.accessToken'),
      session: sessionStorage.getItem('tge.accessToken'),
    })), { local: null, session: null });
    assert.equal(await page.getByRole('status').filter({ hasText: 'signed in successfully' }).count(), 0);
  } finally { await context.close(); }
});

test('a rejected session stays on login with an error instead of a redirect loop', async () => {
  const { page, context, navigations } = await createPage({ rejectSession: true });
  try {
    await page.getByRole('alert').waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForTimeout(1000);
    assert.equal(new URL(page.url()).pathname, '/login');
    assert.equal(navigations.filter(path => path === '/portal').length, 0);
    assert.deepEqual(await page.evaluate(() => ({
      local: localStorage.getItem('tge.accessToken'),
      session: sessionStorage.getItem('tge.accessToken'),
    })), { local: null, session: null });
  } finally { await context.close(); }
});
