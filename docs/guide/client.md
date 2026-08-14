# Type-Safe RPC Client SDK

Velociradix comes with an ultra-lightweight, zero-boilerplate **Type-Safe RPC & Proxy Client** (`velociradix/client`), inspired by Eden Treaty and tRPC.

---

## 1. Quick Start & Initialization

Install and import the client in your Frontend (React, Vue, Next.js, Svelte, or Node.js). You can initialize the client using either a string URL or a configuration object:

```typescript
import { createClient } from 'velociradix/client';

// Method A: Configuration Object
const api = createClient({
  baseURL: 'http://localhost:3000',
  token: 'my-jwt-token'
});

// Method B: URL string with options
const api2 = createClient('http://localhost:3000', {
  token: 'my-jwt-token'
});
```

---

## 2. Dynamic Path Chaining

You can call any backend route simply by chaining path segments as properties:

```typescript
// 1. GET /users?page=1&limit=10
const { data, ok, status } = await api.users.get({
  query: { page: 1, limit: 10 }
});

// 2. GET /users/123 (Path parameters)
const { data: user } = await api.users['123'].get();

// 3. POST /items (Direct body or { body } object)
const { data: item } = await api.items.post({
  title: 'My Item',
  price: 49.99
});

// Or using explicit options:
const { data: order } = await api.api.v1.orders.post({
  body: {
    items: [{ id: 1, qty: 2 }],
    shippingAddress: '123 Main St'
  }
});

// 4. DELETE /users/123
await api.users['123'].delete();
```

---

## 3. Client Options & Authentication

You can configure global authentication tokens, headers, timeouts, and interceptor hooks:

```typescript
const api = createClient({
  baseURL: 'https://api.myapp.com',

  // Global bearer token (automatically sent as Authorization: Bearer ...)
  token: 'my-jwt-token',

  // Custom global headers
  headers: {
    'X-Client-Version': '1.0.0'
  },

  // Global request timeout (ms)
  timeout: 8000,

  // Request & Response interceptor hooks
  onRequest: ({ url, init }) => {
    console.log(`Sending ${init.method} request to ${url}`);
  },
  onResponse: ({ status, ok, data }) => {
    if (!ok) console.error(`API Error ${status}`);
  }
});
```

---

## 4. Response Object Structure

Every client call returns a standardized response promise:

```typescript
interface ClientResponse<T> {
  data: T | null;               // Parsed JSON / text payload
  error: unknown | null;        // Error object / message if status >= 400
  status: number;               // HTTP Status code (200, 201, 400, 404, 500)
  statusText: string;           // HTTP Status message
  headers: Record<string, string>; // Normalized response headers
  ok: boolean;                  // True if HTTP status is 2xx
  raw: Response | null;         // Native Fetch Response
}
```

### Handling Errors Cleanly:
```typescript
const { data, error, ok } = await api.users.post({
  name: 'Moaaz',
  email: 'invalid-email'
});

if (!ok) {
  console.error('Validation error from server:', error);
  return;
}

console.log('Created user:', data);
```
