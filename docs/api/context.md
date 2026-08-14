# Context (`ctx`) API Reference

The `ctx` object encapsulates the incoming HTTP Request (`ctx.req`) and outgoing HTTP Response (`ctx.res`) for each request lifecycle.

> [!TIP]
> The `ctx` object is pooled in memory (V8 Monomorphic Object Pool) to guarantee zero Garbage Collection freezes during high request throughput.

---

## 📥 Request Properties & Operations

### `ctx.req`
Direct reference to the low-level `Request` wrapper object containing parsed request details.

| Property | Type | Description |
| :--- | :--- | :--- |
| `ctx.path` | `string` | URL path portion of request (e.g. `/api/users`). |
| `ctx.method` | `string` | HTTP Method string (`'GET'`, `'POST'`, `'PUT'`, etc.). |
| `ctx.query(key)` | `string` | Returns parsed URL query string parameter value. |
| `ctx.params` | `Record<string, string>` | Key-value object of route path parameters (e.g. `:id`). |
| `ctx.ip` | `string` | Resolved client IP address (supports `setTrustProxy`). |
| `ctx.ips` | `string[]` | Array of proxy IP addresses from `X-Forwarded-For`. |
| `ctx.requestId` | `string` | Unique request correlation ID (`X-Request-ID`). |

---

## 📡 Real-Time & Streaming Helpers

### `ctx.sseInterval(fn, intervalMs?)`
Streams periodic real-time Server-Sent Event (SSE) payloads at configured time intervals:

```javascript
app.get('/live-updates', (ctx) => {
  return ctx.sseInterval(() => ({ timestamp: Date.now() }), 1000);
});
```

---

### `ctx.sseEvent(event, data)`
Sends a named Server-Sent Event (SSE) payload to the client:

```javascript
ctx.sseEvent('user-joined', { userId: 42 });
```

---

## 🛡️ Input Validation & GraphQL

### `ctx.validate(rules, targetData?)`
Validates request body, query string, or path parameters against schema rules. Throws a structured `BadRequestError` (400) if validation fails.

```javascript
app.post('/api/register', (ctx) => {
  const data = ctx.validate({
    username: { type: 'string', required: true, min: 3 },
    email: { type: 'email', required: true }
  });
  return ctx.json({ status: 'ok', data });
});
```

---

### `ctx.graphql(schema, resolvers?)`
Evaluates a GraphQL query or mutation payload directly on the request context:

```javascript
app.post('/api/graphql', (ctx) => {
  return ctx.graphql(`type Query { ping: String }`, { ping: () => 'pong' });
});
```

---

## 📤 Response Operations & Caching

### `ctx.cacheControl(options)`
Fluent helper for setting `Cache-Control` response headers:

```javascript
ctx.cacheControl({ maxAge: 3600, public: true, staleWhileRevalidate: 86400 });
```

---

### `ctx.status(code)`
Sets the HTTP status code for the response.

```javascript
ctx.status(201).json({ created: true });
```

---

### `ctx.json(value)`
Sends a JSON response payload with `Content-Type: application/json`.

```javascript
return ctx.json({ message: 'Hello Velociradix' });
```

---

### `ctx.send(body)`
Sends raw text, Buffer, or object response payload to the client.

```javascript
return ctx.send('Plain text response');
```

---

### `ctx.sendFile(filepath, opts?)`
Serves a static file from disk with ETag calculation, `304 Not Modified`, and `HTTP 206 Partial Content` Byte-Range Request support.

```javascript
return ctx.sendFile('./uploads/report.pdf');
```

---

### `ctx.setCookie(name, value, options?)`
Sets a `Set-Cookie` response header.

```javascript
ctx.setCookie('sid', '123456', { httpOnly: true, secure: true, maxAge: 3600 });
```
