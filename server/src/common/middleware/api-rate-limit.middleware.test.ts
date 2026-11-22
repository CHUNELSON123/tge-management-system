import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import { createApiRateLimiter } from './api-rate-limit.middleware.js';

test('API requests share a budget across paths and methods, with separate budgets per client', async (t) => {
  const app = express();
  // Only this test trusts forwarding headers from its loopback proxy.
  app.set('trust proxy', 'loopback');
  const limiter = createApiRateLimiter({ limit: 2 });
  app.use('/api', limiter);
  app.get('/api/first', (_req, res) => res.json({ ok: true }));
  app.post('/api/second', (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const firstClient = { 'X-Forwarded-For': '192.0.2.1' };
  const secondClient = { 'X-Forwarded-For': '192.0.2.2' };
  for (const [path, method, headers] of [
    ['/api/first', 'GET', firstClient],
    ['/api/second', 'POST', firstClient],
    ['/api/first', 'GET', secondClient],
  ] as const) {
    const response = await fetch(`${base}${path}`, { method, headers });
    assert.equal(response.status, 200);
    await response.json();
  }
  const blocked = await fetch(`${base}/api/second`, { method: 'POST', headers: firstClient });
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), { message: 'Too many requests. Please try again later.' });
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  assert.ok(blocked.headers.has('ratelimit'));
  assert.ok(blocked.headers.has('ratelimit-policy'));
  assert.equal(blocked.headers.has('x-ratelimit-limit'), false);

  const unaffected = await fetch(`${base}/api/second`, { method: 'POST', headers: secondClient });
  assert.equal(unaffected.status, 200);
  await unaffected.json();
});
