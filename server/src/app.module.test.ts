import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { API_REQUEST_LIMIT } from './common/middleware/api-rate-limit.middleware.js';

test('the application limits all API routes before authentication and parsing, including future routes', async (t) => {
  // Construct real routers without connecting to a database or sending emails.
  const defaults = {
    DATABASE_URL: 'postgresql://unused:unused@127.0.0.1:1/tge_qa_rate_limit',
    RESEND_API_KEY: 'rate-limit-test-not-a-provider-key',
    EMAIL_FROM: 'rate-limit@example.invalid',
  };
  for (const [name, value] of Object.entries(defaults)) {
    if (process.env[name] === undefined) {
      process.env[name] = value;
      t.after(() => { delete process.env[name]; });
    }
  }
  const { createApp } = await import('./app.module.js');
  // App initialization starts a background task that may open the shared Prisma pool.
  // Close that pool after this test so its worker can exit when PostgreSQL is reachable.
  const { prisma } = await import('database');
  t.after(async () => { await prisma.$disconnect(); });
  const app = createApp();
  app.post('/api/future-route', (_req, res) => res.json({ ok: true }));
  app.get('/status', (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const future = await fetch(`${base}/api/future-route`, { method: 'POST' });
  assert.equal(future.status, 200);
  await future.json();
  const unauthenticated = await fetch(`${base}/api/auth/session`);
  assert.equal(unauthenticated.status, 401);
  await unauthenticated.json();
  for (let request = 2; request < API_REQUEST_LIMIT; request++) {
    const response = await fetch(`${base}/api/health`);
    assert.equal(response.status, 200);
    await response.json();
  }
  for (const [path, method] of [
    ['/api/health', 'GET'],
    ['/api/auth/login', 'POST'],
    ['/api/auth/accounts', 'POST'],
    ['/api/membership-applications', 'POST'],
    ['/api/public/events', 'GET'],
    ['/api/member/profile', 'PATCH'],
    ['/api/member/conversations', 'GET'],
    ['/api/member/notifications', 'GET'],
    ['/api/future-route', 'POST'],
  ]) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.0.2.99' },
      // A rejected request must not reach the JSON parser either.
      ...(method !== 'GET' ? { body: '{' } : {}),
    });
    assert.equal(response.status, 429, `${method} ${path}`);
    assert.deepEqual(await response.json(), { message: 'Too many requests. Please try again later.' });
    assert.ok(Number(response.headers.get('retry-after')) > 0);
  }
  const outsideApi = await fetch(`${base}/status`);
  assert.equal(outsideApi.status, 200);
  await outsideApi.json();
});
