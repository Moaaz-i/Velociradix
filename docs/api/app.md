# Application (`app`) API Reference

The `app` instance is the central application server created via `velociradix()` or `createApp()`.

---

## ⚡ Application Methods

### `app.listen(port, host?, callback?)`
Starts the C++ native event loop and listens for incoming HTTP connections.
- **`port`**: `number` - Port number (e.g. `3000`).
- **`host`**: `string` - Bind host address (default: `'0.0.0.0'`).
- **`callback`**: `Function` - Executed when the server starts listening.

```js
app.listen(3000, () => {
  console.log('Velociradix server listening on http://localhost:3000');
});
```

---

### `app.use(middleware)`
Registers global middlewares executed on every incoming request.
```js
app.use(logger());
app.use(async (ctx, next) => {
  ctx.state.startTime = Date.now();
  await next();
});
```

---

### `app.useExpress(expressMiddleware)`
Mounts standard Express.js middlewares (e.g., `cors`, `morgan`, `body-parser`) directly into Velociradix.

```js
import expressCors from 'cors';
app.useExpress(expressCors());
```

---

### Routing Methods (`get`, `post`, `put`, `delete`, `patch`, `all`)
Registers HTTP routes matching specified paths.

- **`app.get(path, handler, options?)`**
- **`app.post(path, handler, options?)`**
- **`app.put(path, handler, options?)`**
- **`app.delete(path, handler, options?)`**
- **`app.patch(path, handler, options?)`**
- **`app.all(path, handler, options?)`**

```js
app.get('/users/:id', (ctx) => {
  return ctx.json({ userId: ctx.params.id });
}, {
  middlewares: [rateLimit({ max: 10 })],
  name: 'Get User By ID',
  description: 'Fetches detailed profile information for a user.'
});
```

---

### `app.fastGet(path, data, status?, headers?)` & `app.fastPost(...)`
Registers zero-allocation native C++ fast-path routes served directly from C++ heap at 120,000+ req/s.

```js
app.fastGet('/fast-ping', 'pong', 200, { 'X-Engine': 'C++17' });
app.fastPost('/fast-json', JSON.stringify({ ok: true }));
```

---

### `app.group(prefix, callback)`
Groups related routes under a common URL prefix.

```js
app.group('/api/v1', (v1) => {
  v1.get('/users', (ctx) => ctx.json([]));
  v1.get('/posts', (ctx) => ctx.json([]));
});
```

---

### `app.postmanUI(docsPath, options?)` & `app.generatePostmanCollection(options?)`
Hosts a built-in Postman API Playground or exports Postman Collection JSON.

```js
app.postmanUI('/docs/postman', { title: 'My API Docs' });
```

---

### `app.swaggerUI(docsPath, options?)` & `app.generateOpenAPISpec(options?)`
Hosts an interactive Swagger UI documentation page or exports OpenAPI 3.0 JSON spec.

```js
app.swaggerUI('/docs/swagger', { title: 'My API Docs' });
```

---

### `app.setWorkers(n)`
Sets the number of C++ native worker threads for TCP socket multiplexing and `SO_REUSEPORT` kernel load balancing.
- **`n`**: `number` - Number of C++ worker threads (e.g., `4` or `os.cpus().length`).

```js
import os from 'node:os';
import velociradix from 'velociradix';

const app = velociradix();

// Configure C++ worker threads to match CPU cores
app.setWorkers(os.cpus().length);

app.listen(3000);
```

---

### `app.setPayloadLimit(bytes)`
Sets the maximum allowed request body payload limit in bytes at the native C++ level.
- **`bytes`**: `number` - Maximum payload size (default: `10 * 1024 * 1024` for 10MB).

```js
// Restrict request body size to 2MB
app.setPayloadLimit(2 * 1024 * 1024);
```

---

### `app.health(path?, checkFn?)`
Registers an automated health-check endpoint returning system uptime and optional custom status checks.
- **`path`**: `string` - Endpoint route path (default: `'/health'`).
- **`checkFn`**: `AsyncFunction` - Optional callback returning custom metrics object `{ db: 'connected' }`.

```js
app.health('/health', async () => {
  const dbConnected = await db.ping();
  return { db: dbConnected ? 'connected' : 'disconnected' };
});
```

---

### `app.redirectRoute(fromPath, toPath, status?)`
Registers an automatic HTTP route redirection (default status: `302`).

```js
app.redirectRoute('/old-home', '/new-home', 301);
```

---

### `app.notFound(handler)`
Registers a custom fallback handler for unmatched 404 routes.

```js
app.notFound((ctx) => {
  return ctx.status(404).json({ error: 'Route not found', path: ctx.path });
});
```

---

### `app.onError(handler)`
Registers a global error handler for uncaught exceptions thrown inside route handlers or middlewares.

```js
app.onError((err, ctx) => {
  console.error('Uncaught Exception:', err.stack);
  return ctx.status(500).json({ error: 'Internal Server Error', message: err.message });
});
```

---

### `app.setTrustProxy(boolean)`
Enables or disables trusting `X-Forwarded-For` and proxy headers when resolving `ctx.ip` and `ctx.ips`.

```js
app.setTrustProxy(true);
```

---

### `app.enableCors(options?)`
Enables native C++ high-speed CORS preflight handling.

```js
app.enableCors({ origin: 'https://example.com' });
```

---

### `app.serveStatic(prefix, directory, options?)`
Serves static files from a directory under a specific URL path prefix.

```js
app.serveStatic('/static', './public');
```

---

### `app.gracefulShutdown(options?)`
Gracefully stops accepting new connections, waits for active requests to finish, and shuts down the server cleanly.

```js
app.gracefulShutdown({
  onShutdown: () => {
    console.log('Database connections closed cleanly.');
  }
});
```

---

### `app.close()`
Immediately closes the server socket and frees native C++ memory resources.



