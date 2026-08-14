# In-Memory Testing (`app.inject`)

Velociradix provides an ultra-fast **In-Memory Request Simulation Engine** (`app.inject`), allowing you to test endpoints, middlewares, authentication, and validation with zero network overhead without binding a real TCP port.

---

## 1. Quick Example

You can run `app.inject()` directly inside your test suite (Vitest, Jest, Node.js test runner):

```javascript
import { createApp } from 'velociradix';
import assert from 'node:assert/strict';

const app = createApp();

app.post('/api/users', async (ctx) => {
  const body = await ctx.body();
  return ctx.status(201).json({ id: 1, name: body.name });
});

// Test execution in memory
const response = await app.inject({
  method: 'POST',
  url: '/api/users',
  body: { name: 'Alice' }
});

assert.equal(response.statusCode, 201);
assert.equal(response.ok, true);
assert.deepEqual(response.json(), { id: 1, name: 'Alice' });
```

---

## 2. Options Parameter

The `app.inject(options)` method accepts either a URL string or an options object:

```typescript
interface InjectOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;
  url?: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
}
```

### Examples:
```javascript
// 1. Simple GET shortcut
const res = await app.inject('/health');

// 2. Custom headers and authentication
const authRes = await app.inject({
  method: 'GET',
  url: '/protected',
  headers: {
    authorization: 'Bearer my-token',
    accept: 'application/json'
  }
});
```

---

## 3. Response Structure

Every `app.inject()` call returns an `InjectResponse` object:

```typescript
interface InjectResponse {
  statusCode: number;           // HTTP Status Code (200, 201, 400, 404, 500)
  status: number;               // Alias to statusCode
  headers: Record<string, string>; // Response headers
  body: string;                 // Raw response body string
  text(): string;               // Body as text string
  json<T = any>(): T;           // Parsed JSON response payload
  ok: boolean;                  // True if status code is 2xx
}
```
