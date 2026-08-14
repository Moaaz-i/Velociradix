# Type-Safe RPC Client SDK

Velociradix comes with an ultra-lightweight, zero-boilerplate **Type-Safe RPC & Proxy Client** (`velociradix/client`), inspired by Eden Treaty and tRPC.

---

## 1. Quick Start

Install and import the client in your Frontend (React, Vue, Next.js, Svelte, or Node.js):

```typescript
import { createClient } from 'velociradix/client';

// Initialize the client pointing to your Velociradix backend
const api = createClient('http://localhost:3000');
```

---

## 2. Dynamic Path Chaining

You can call any backend route simply by chaining path segments as properties:

```typescript
// GET /users?page=1&limit=10
const { data, ok, status } = await api.users.get({
  query: { page: 1, limit: 10 }
});

// GET /users/123
const { data: user } = await api.users['123'].get();

// POST /api/v1/orders
const { data: order, error } = await api.api.v1.orders.post({
  body: {
    items: [{ id: 1, qty: 2 }],
    shippingAddress: '123 Main St'
  }
});

// DELETE /users/123
await api.users['123'].delete();
```

---

## 3. Client Options & Authentication

You can configure global authentication tokens, headers, timeouts, and interceptor hooks:

```typescript
const api = createClient('https://api.myapp.com', {
  // Global bearer token
  token: 'my-jwt-token',

  // Custom global headers
  headers: {
    'X-Client-Version': '1.0.0'
  },

  // Global request timeout (ms)
  timeout: 8000,

  // Request & Response hooks
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
const { data, error, ok } = await api.users.post({ body: newUser });

if (!ok) {
  alert(`Error: ${error}`);
  return;
}

console.log('Created user:', data);
```
