# Troubleshooting & Common Issues

A comprehensive guide to real-world errors, edge cases, and diagnostic solutions when deploying and developing with Velociradix.

---

## 🛑 1. Native C++ Addon Not Found (`velociradix.node`)

### Symptom
```text
Error: velociradix native addon not found. Run `npm rebuild velociradix`...
```

### Root Cause
Velociradix relies on a C++17 native Node-API addon (`bin/velociradix.node`). This occurs if:
1. `npm install` was run with `--ignore-scripts`.
2. Operating system / CPU architecture is not in the prebuilt matrix (`darwin-arm64`, `linux-x64`, `win32-x64`).
3. Running inside a minimal Docker container lacking build tools.

### Solution
Run explicit rebuild or compile natively using `make`:

```bash
# Option A: Rebuild addon
npm rebuild velociradix

# Option B: Compile from source (requires g++ >= 9 or clang++ >= 10)
make clean && make
```

**Docker Fix:** Ensure `build-essential` / `g++` & `make` are installed in your `Dockerfile`:
```dockerfile
RUN apt-get update && apt-get install -y build-essential python3 make g++
```

---

## 🌐 2. CORS Preflight (`OPTIONS 404` or Blocked by Browser)

### Symptom
Browser console error:
```text
Access to fetch at 'http://localhost:3000/api' from origin 'http://localhost:5173' has been blocked by CORS policy.
```

### Root Cause
1. `cors()` middleware was not mounted globally or was mounted *after* route definitions.
2. `OPTIONS` HTTP preflight request is not handled for custom headers.

### Solution
Always mount `cors()` at the very top of your application before defining routes:

```js
import { createApp, cors } from 'velociradix';

const app = createApp();

// ✅ Mount CORS globally at the top
app.use(cors({
  origin: '*',
  methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
  headers: 'Content-Type,Authorization,X-Requested-With',
  credentials: true
}));

app.get('/api/data', (ctx) => ctx.json({ status: 'ok' }));
```

---

## ⚡ 3. High Latency & Drop in Benchmarks (~15k vs 120k req/s)

### Symptom
`autocannon` or `wrk` benchmark shows lower throughput than expected.

### Root Cause
Synchronous console logging (`app.use(logger())`) writes to `stdout`, creating thread-blocking IO bottlenecks during high-concurrency benchmarks.

### Solution
1. Disable `logger()` in benchmark mode.
2. Utilize native C++ **Fast-Path** routes (`fastGet` / `fastPost`) for static JSON benchmarks:

```js
// Disable logger during benchmarks
// app.use(logger());

// Ultra-fast zero-allocation native route (120,000+ req/s)
app.fastGet('/fast-json', JSON.stringify({ message: 'speed' }));
```

---

## 🚫 4. Port Already in Use (`EADDRINUSE`)

### Symptom
```text
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

### Root Cause
A background process or a previous crashed instance of Node.js is still bound to the port.

### Solution
Kill the process holding port 3000:

```bash
# macOS / Linux
lsof -i :3000 | awk 'NR>1 {print $2}' | xargs kill -9

# Windows PowerShell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

---

## 📦 5. Empty Payload in `ctx.req.body` or `await ctx.body()`

### Symptom
`await ctx.body()` returns `{}` or `ctx.req.body` is empty on POST/PUT requests.

### Root Cause
1. Client failed to send the `Content-Type: application/json` header.
2. Request payload exceeds the default memory buffer limit.

### Solution
Ensure `Content-Type` is set properly by client, or use `sizeLimit` middleware:

```js
app.post('/api/users', async (ctx) => {
  const body = await ctx.body();
  if (!body || Object.keys(body).length === 0) {
    throw new BadRequestError('Invalid or missing JSON payload');
  }
  return ctx.json({ received: body });
});
```

---

## 📡 6. SSE Connection Dropping or Not Streaming

### Symptom
Server-Sent Events (`ctx.sse()`) hang, buffer responses, or disconnect immediately.

### Root Cause
Nginx or reverse proxy buffering `text/event-stream` responses or closing HTTP connection timeouts.

### Solution
1. Ensure reverse proxy buffering is disabled.
2. Implement heartbeat ping in `ctx.sse()`:

```js
app.get('/events', (ctx) => {
  ctx.sse((sendEvent, close) => {
    // Send immediate initial event
    sendEvent({ data: 'ok' }, 'connected');

    // Send heartbeat every 15s to keep connection alive through proxies
    const timer = setInterval(() => {
      sendEvent({ data: 'keepalive' }, 'ping');
    }, 15000);
  });
});
```

---

## 🔄 7. Express Middleware Shim Incompatibilities

### Symptom
An Express middleware mounted with `app.useExpress(fn)` crashes or hangs.

### Root Cause
The Express middleware relies on missing Express-specific internal APIs (`res.render`, `res.format`, etc.).

### Solution
Velociradix provides a high-performance response shim (`setHeader`, `getHeader`, `setStatus`, `statusCode`). If an Express middleware requires deep internal Express methods, rewrite it as a native Velociradix middleware:

```js
// Native Velociradix middleware alternative:
app.use(async (ctx, next) => {
  ctx.setHeader('X-Custom-Header', 'val');
  await next();
});
```

---

## 🔒 8. JWT Secret Key / Verification Errors

### Symptom
`UnauthorizedError: Invalid token signature` or `Token expired`.

### Root Cause
Secret key mismatch between signing and verification, or client clock skew.

### Solution
Ensure `secret` is identical across `jwtSign` and `jwtAuth`:

```js
const SECRET = process.env.JWT_SECRET || 'strong-secret-key-32-chars!!';

app.use('/api/protected/*', jwtAuth({ secret: SECRET }));
```

