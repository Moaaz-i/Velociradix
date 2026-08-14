import assert from 'node:assert/strict';
import velociradix, { createApp, createEventBus } from '../index.mjs';
import { createClient } from '../client.mjs';
import { Controller, Get, Post, Body, Param, Query, registerController, Use, Injectable, Inject, Container } from '../decorators.mjs';

async function runTests() {
  console.log('🚀 Running Velociradix v7.5.0 Feature Tests...\n');

  // ==========================================
  // 1. EVENTBUS / MICROSERVICES TESTS
  // ==========================================
  console.log('Testing EventBus / Microservices Engine...');
  const bus = createEventBus();
  const receivedEvents = [];

  // Wildcard listener
  bus.on('user.*', (payload, meta) => {
    receivedEvents.push({ pattern: meta.pattern, event: meta.event, payload });
  });

  // Specific listener
  bus.on('user.created', (payload) => {
    receivedEvents.push({ specific: true, payload });
  });

  await bus.emit('user.created', { id: 42, name: 'Moaaz' });
  await bus.emit('user.deleted', { id: 42 });
  await bus.emit('order.placed', { orderId: 99 });

  assert.equal(receivedEvents.length, 3);
  assert.equal(receivedEvents[0].event, 'user.created');
  assert.equal(receivedEvents[1].specific, true);
  assert.equal(receivedEvents[2].event, 'user.deleted');
  console.log('  ✔ EventBus wildcard matching & listeners passed');

  // Request - Reply test
  bus.on('calc.add', (payload, meta) => {
    bus.reply(meta, { sum: payload.a + payload.b });
  });

  const reply = await bus.request('calc.add', { a: 15, b: 25 }, 2000);
  assert.deepEqual(reply, { sum: 40 });
  console.log('  ✔ EventBus Request-Reply RPC pattern passed\n');

  // ==========================================
  // 2. SCHEMA VALIDATION TESTS
  // ==========================================
  console.log('Testing Schema Validation & OpenAPI...');
  const app = createApp();

  app.post('/api/users', {
    schema: {
      body: {
        name: { type: 'string', required: true, min: 2 },
        email: { type: 'email', required: true },
        age: { type: 'number', required: false, min: 18 }
      }
    }
  }, async (ctx) => {
    return ctx.status(201).json({ user: ctx.validBody });
  });

  const openapiSpec = app.openapi({ title: 'Test API' });
  assert.ok(openapiSpec.paths['/api/users']);
  assert.ok(openapiSpec.paths['/api/users'].post.requestBody);
  console.log('  ✔ OpenAPI auto-schema parameters generation passed');

  // ==========================================
  // 3. DECORATORS & OOP CONTROLLERS
  // ==========================================
  console.log('Testing OOP Decorators & Dependency Injection...');

  class UserService {
    getUser(id) {
      return { id: Number(id), name: 'Decorated User', email: 'user@test.com' };
    }
  }
  Injectable()(UserService);

  class ItemController {
    constructor() {
      this.userService = Container.resolve(UserService);
    }

    getAll(limit, ctx) {
      return { items: [1, 2, 3], limit: limit || 10 };
    }

    getOne(id) {
      return this.userService.getUser(id);
    }

    create(title, fullBody) {
      return { title, fullBody };
    }
  }

  // Apply method decorators
  Get('/')(ItemController.prototype, 'getAll', Object.getOwnPropertyDescriptor(ItemController.prototype, 'getAll'));
  Query('limit')(ItemController.prototype, 'getAll', 0);

  Get('/:id')(ItemController.prototype, 'getOne', Object.getOwnPropertyDescriptor(ItemController.prototype, 'getOne'));
  Param('id')(ItemController.prototype, 'getOne', 0);

  Post('/')(ItemController.prototype, 'create', Object.getOwnPropertyDescriptor(ItemController.prototype, 'create'));
  Body('title')(ItemController.prototype, 'create', 0);
  Body()(ItemController.prototype, 'create', 1);

  // Apply class decorator
  Controller('/items')(ItemController);

  app.registerController(ItemController);
  console.log('  ✔ Decorator controller and DI registration passed\n');

  // ==========================================
  // 4. TYPE-SAFE CLIENT SDK (INTEGRATION TEST)
  // ==========================================
  console.log('Testing Type-Safe RPC Client SDK...');
  const PORT = 9222;
  await new Promise((resolve) => app.listen(PORT, resolve));

  const client = createClient(`http://localhost:${PORT}`);

  try {
    // Test 1: GET items list with query param
    const itemsRes = await client.items.get({ query: { limit: 5 } });
    assert.equal(itemsRes.status, 200);
    assert.equal(itemsRes.ok, true);
    assert.deepEqual(itemsRes.data, { items: [1, 2, 3], limit: '5' });
    console.log('  ✔ Client GET request & query string serialization passed');

    // Test 2: GET item with path parameter
    const itemRes = await client.items['77'].get();
    if (itemRes.status !== 200) console.log('itemRes error:', itemRes);
    assert.equal(itemRes.status, 200);
    assert.deepEqual(itemRes.data, { id: 77, name: 'Decorated User', email: 'user@test.com' });
    console.log('  ✔ Client path parameter chaining (client.items[77].get()) passed');

    // Test 3: POST item with body
    const createRes = await client.items.post({ body: { title: 'Book', price: 29.99 } });
    assert.equal(createRes.status, 200);
    assert.equal(createRes.data.title, 'Book');
    assert.equal(createRes.data.fullBody.price, 29.99);
    console.log('  ✔ Client POST JSON serialization passed');

    // Test 4: Schema validation failure (400)
    const invalidRes = await client.api.users.post({ body: { name: 'A', email: 'invalid-email' } });
    assert.equal(invalidRes.status, 400);
    assert.equal(invalidRes.ok, false);
    assert.ok(invalidRes.error);
    console.log('  ✔ Client received formatted 400 Bad Request on invalid schema');

    // Test 5: Schema validation success (201)
    const validRes = await client.api.users.post({ body: { name: 'Moaaz', email: 'moaaz@example.com', age: 25 } });
    assert.equal(validRes.status, 201);
    assert.equal(validRes.ok, true);
    assert.equal(validRes.data.user.name, 'Moaaz');
    assert.equal(validRes.data.user.email, 'moaaz@example.com');
    console.log('  ✔ Valid schema request succeeded with 201 Created');

  } finally {
    app.close();
  }

  // ==========================================
  // 5. IN-MEMORY INJECT, VERSIONING & CONTEXT HELPERS
  // ==========================================
  console.log('\nTesting In-Memory app.inject(), Versioning & Content Helpers...');
  const testApp = createApp();

  testApp.get('/test-inject', (ctx) => {
    return ctx.json({ injected: true, user: 'John' });
  });

  testApp.get('/format-test', (ctx) => {
    return ctx.format({
      json: { type: 'json' },
      html: '<h1>HTML</h1>',
      text: 'plain text'
    });
  });

  testApp.version('v1', (v1) => {
    v1.get('/profile', (ctx) => ({ version: 'v1' }));
  });

  // Test inject GET
  const inj1 = await testApp.inject({ method: 'GET', url: '/test-inject' });
  assert.equal(inj1.statusCode, 200);
  assert.equal(inj1.ok, true);
  assert.deepEqual(inj1.json(), { injected: true, user: 'John' });
  console.log('  ✔ app.inject() GET request passed');

  // Test inject format JSON
  const injJson = await testApp.inject({ method: 'GET', url: '/format-test', headers: { accept: 'application/json' } });
  assert.equal(injJson.statusCode, 200);
  assert.deepEqual(injJson.json(), { type: 'json' });

  // Test inject format HTML
  const injHtml = await testApp.inject({ method: 'GET', url: '/format-test', headers: { accept: 'text/html' } });
  assert.equal(injHtml.statusCode, 200);
  assert.equal(injHtml.body, '<h1>HTML</h1>');
  console.log('  ✔ ctx.format() content negotiation passed');

  // Test API versioning
  const injV1 = await testApp.inject({ method: 'GET', url: '/v1/profile' });
  assert.equal(injV1.statusCode, 200);
  assert.deepEqual(injV1.json(), { version: 'v1' });
  console.log('  ✔ app.version() route routing passed');

  // Test 404 injection
  const inj404 = await testApp.inject({ method: 'GET', url: '/non-existing-path' });
  assert.equal(inj404.statusCode, 404);
  assert.equal(inj404.ok, false);
  console.log('  ✔ app.inject() 404 fallback passed');

  // Test multipart form-data parsing
  testApp.post('/upload-test', async (ctx) => {
    const data = await ctx.formData();
    return ctx.json({ username: data.fields.username, fileName: data.files.avatar?.filename });
  });

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const multipartBody = `--${boundary}\r\nContent-Disposition: form-data; name="username"\r\n\r\nMoaaz\r\n--${boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="avatar.png"\r\nContent-Type: image/png\r\n\r\nPNGDATA\r\n--${boundary}--\r\n`;

  const injUpload = await testApp.inject({
    method: 'POST',
    url: '/upload-test',
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    body: multipartBody
  });

  assert.equal(injUpload.statusCode, 200);
  assert.deepEqual(injUpload.json(), { username: 'Moaaz', fileName: 'avatar.png' });
  console.log('  ✔ ctx.formData() multipart streaming parser passed');

  console.log('\n🎉 ALL VELOCIRADIX TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
