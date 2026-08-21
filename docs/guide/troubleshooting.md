# Troubleshooting & Common Issues (40 Problems & Solutions)

A comprehensive, production-tested diagnostic guide to 40 real-world errors, edge cases, and solutions when developing and deploying with **Velociradix**.

---

## 🛑 1. Native C++ Addon Not Found (`velociradix.node`)

### Symptom

```text
Error: velociradix native addon not found. Run `npm rebuild velociradix`...
```

### Root Cause

Velociradix relies on a C++17 native Node-API addon (`bin/velociradix.node`). Occurs if `npm install` ran with `--ignore-scripts` or inside a container without build tools.

### Solution

```bash
npm rebuild velociradix
# Or compile from source:
make clean && make NODE_INC=$(node -e 'console.log(require("path").join(process.execPath, "../../include/node"))') addon
```

---

## 🔒 2. Port Binding Failed (`velociradix: bind() failed - Port 3000 is already in use`)

### Symptom

```text
Error: velociradix: bind() failed - Port 3000 is already in use
```

### Root Cause

Another process or Velociradix instance is currently listening on port 3000. Velociradix checks port availability synchronously during `app.listen()`.

### Solution

Identify and kill the process using port 3000:

```bash
lsof -i :3000
kill -9 <PID>
```

Or specify a dynamic/free port in `app.listen(0)`.

---

## 📊 3. `morgan` / Express Loggers Printing Empty Fields (`status` or `response-time` `-`)

### Symptom

`morgan('dev')` logs `GET /api - - ms - -` with empty status code and timing.

### Root Cause

`morgan` checks `res.headersSent` and `res._header`. If response was sent via native `ctx.send()`, Express `res` flags were not synchronized.

### Solution

> [!NOTE]
> Fixed in **v7.0.0**. Upgrade to Velociradix `v7.0.0` where `respondRes` automatically synchronizes `res.headersSent = true`, `res.finished = true`, and executes `res.writeHead()` hooks for `morgan` & `response-time`.

---

## 🔀 4. Multiple `useExpress` Middlewares Overwriting `res` Context

### Symptom

Only the last `useExpress` middleware receives response completion events (`res.on('finish')`).

### Root Cause

Registering multiple `useExpress` calls previously overwrote `ctx._expressRes`.

### Solution

Upgrade to **v7.0.0**. Velociradix maintains `ctx._expressResList` array to propagate events to all Express middleware instances.

---

## 🌐 5. CORS Preflight Blocked (`OPTIONS 404`)

### Symptom

Browser console error:

```text
Access to fetch at 'http://localhost:3000/api' from origin 'http://localhost:5173' has been blocked by CORS policy.
```

### Root Cause

`cors()` middleware was mounted below route definitions or OPTIONS HTTP method was unhandled.

### Solution

Mount `cors()` at the very top of your application before defining routes:

```javascript
import { createApp, cors } from "velociradix";
const app = createApp();

app.use(cors({ origin: "*" }));
```

---

## 🛠️ 6. VitePress Command Not Found (`sh: vitepress: command not found`)

### Symptom

Running `npm run docs:dev` or `npm run docs:build` fails with exit code 127.

### Root Cause

`node_modules` or `vitepress` package is not installed.

### Solution

```bash
npm install
npm run docs:build
```

---

## 🏎️ 7. `velociradix/express` Import Failed (`ERR_MODULE_NOT_FOUND`)

### Symptom

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'velociradix/express'
```

### Root Cause

Using an older version of Velociradix (< `v7.0.0`) that does not export `./express` in `package.json`.

### Solution

Update `package.json` dependency to `"velociradix": "^7.0.0"`.

---

## 🛡️ 8. Validation Error: `ctx.validate()` Throwing 400

### Symptom

Request fails with `400 Bad Request`: `{ "error": "Validation failed", "details": { "errors": [...] } }`.

### Root Cause

Incoming payload did not satisfy rules specified in `ctx.validate(schema)`.

### Solution

Inspect validation errors in `details.errors` array and ensure client payload matches required schema types.

---

## 📥 9. `ctx.body()` Returning Undefined or Empty Object

### Symptom

`await ctx.body()` returns `undefined` on `POST` requests.

### Root Cause

Request headers missing `Content-Type: application/json` or payload size exceeds limit.

### Solution

Set client header `Content-Type: application/json` and verify payload size limit:

```javascript
app.setPayloadLimit(10 * 1024 * 1024); // 10 MB limit
```

---

## 📁 10. `ctx.sendFile()` Path Traversal Error

### Symptom

`ctx.sendFile(filepath)` returns 403 Forbidden or 404 Not Found.

### Root Cause

File path contains directory traversal sequences (`../`) resolving outside allowed directory.

### Solution

Pass `{ root }` so the resolved path must stay inside that directory:

```javascript
return ctx.sendFile(reqPath, { root: "./public" });
```

---

## 🔑 11. JWT Verification Error (`Token Invalid / Expired`)

### Symptom

`ctx.jwtVerify(secret)` throws `401 Unauthorized`.

### Root Cause

Authorization header missing `Bearer ` prefix or token expiration time (`exp`) passed.

### Solution

Send header as `Authorization: Bearer <token>` and verify secret matches signer:

```javascript
const token = ctx.jwtSign({ userId: 1 }, secret, { expiresIn: 3600 });
```

---

## 🍪 12. Encrypted Cookies Not Persisting

### Symptom

`ctx.getEncryptedCookie(name, secret)` returns `undefined` on subsequent requests.

### Root Cause

Cookie secret key mismatch or cookie `SameSite` / `Domain` attribute mismatch.

### Solution

Ensure identical secret key is passed to both `setEncryptedCookie` and `getEncryptedCookie`:

```javascript
ctx.setEncryptedCookie("session", data, SECRET_KEY, { httpOnly: true });
```

---

## 🔒 13. Rate Limiter Blocking Legitimate Proxied Requests

### Symptom

All users behind a reverse proxy (NGINX / Cloudflare) get rate limited together (`429 Too Many Requests`).

### Root Cause

`ctx.ip` defaulted to proxy IP (`127.0.0.1`) because `setTrustProxy` was disabled.

### Solution

Enable `setTrustProxy(true)` so rate limit tracks client IP from `X-Forwarded-For`:

```javascript
app.setTrustProxy(true);
app.use(rateLimit({ windowMs: 60000, max: 100 }));
```

---

## 💾 14. Memory Spike on Heavy File Streams

### Symptom

Node process RSS memory grows significantly during large file downloads.

### Root Cause

Buffering entire file into memory before sending instead of chunked response.

### Solution

Use `ctx.sendFile(path)` which leverages native range streaming and low memory footprint.

---

## 💥 15. Uncaught Async Route Exceptions Crashing Process

### Symptom

Unhandled promise rejection terminates Node process.

### Root Cause

Async error inside custom middleware without try/catch or next handling.

### Solution

Register global error handler via `app.onError`:

```javascript
app.onError((err, ctx) => {
  console.error("Unhandled Route Error:", err);
  return ctx.status(500).json({ error: err.message });
});
```

---

## 📂 16. Static Directory Serving 404

### Symptom

`app.serveStatic('/static', './public')` returns 404 for valid files.

### Root Cause

Relative path resolved from different working directory.

### Solution

Use absolute path resolved via `import.meta.url`:

```javascript
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
app.serveStatic("/static", join(__dirname, "public"));
```

---

## 📘 17. TypeScript Error on Custom `ctx.state` Properties

### Symptom

TypeScript error `Property 'user' does not exist on type 'ContextState'`.

### Root Cause

Custom properties attached to `ctx.state` need interface augmentation.

### Solution

Augment `ContextState` in your project declaration file (`types.d.ts`):

```typescript
declare module "velociradix" {
  interface ContextState {
    user?: { id: number; role: string };
  }
}
```

---

## 🔤 18. `ctx.renderHtml()` HTML Entities Unescaped

### Symptom

Template variables contain raw HTML tags rendering unintended UI.

### Root Cause

Passing unescaped user input into `ctx.renderHtml()`.

### Solution

Use `ctx.escapeHtml()` on untrusted variables before rendering:

```javascript
const safeName = ctx.escapeHtml(userInput);
return ctx.renderHtml("<h1>Hello {{ name }}</h1>", { name: safeName });
```

---

## 📦 19. Multer File Upload Returning `req.file` Undefined

### Symptom

`ctx.req.file` is `undefined` inside upload handler.

### Root Cause

`useExpress(upload.single('file'))` was not executed before route handler.

### Solution

Mount multer middleware via `useExpress`:

```javascript
import multer from "multer";
const upload = multer({ dest: "uploads/" });

app.useExpress(upload.single("avatar"));
app.post("/upload", (ctx) => ctx.json({ file: ctx.req.file }));
```

---

## ⚡ 20. Server-Sent Events (`ctx.sse()`) Connection Timeout

### Symptom

SSE stream closes automatically after 30 seconds.

### Root Cause

Reverse proxy or load balancer timing out idle HTTP connections.

### Solution

Send periodic heartbeat ping messages in your SSE loop:

```javascript
const interval = setInterval(() => {
  ctx.sseSend(": heartbeat\n\n");
}, 15000);
```

---

## 📄 21. Postman & Swagger UI Missing Registered Routes

### Symptom

`/docs` or `/postman-docs` UI does not display routes registered after call.

### Root Cause

Calling `app.swagger()` or `app.postmanDoc()` before registering all routes.

### Solution

Call `app.swagger()` or `app.postmanDoc()` after registering all application routes.

---

## 🌐 22. `ctx.ip` Returning Localhost Behind NGINX

### Symptom

`ctx.ip` returns `127.0.0.1` when deployed behind NGINX or AWS ALB.

### Root Cause

`setTrustProxy` not enabled.

### Solution

```javascript
app.setTrustProxy(true);
```

---

## ⚙️ 23. Shutdown Hooks Not Executing in Docker Container

### Symptom

Container exits instantly on `docker stop` without running `onShutdown` callbacks.

### Root Cause

Node process running as PID 1 inside container without signal forwarding.

### Solution

Use `tini` or `init` in Docker container:

```dockerfile
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "index.mjs"]
```

---

## ⚡ 24. C++ Fast-Path `fastGet` Bypassing Middlewares

### Symptom

`app.fastGet('/static', data)` does not execute JS middlewares.

### Root Cause

Fast-Path responses serve data directly from C++ native memory for maximum performance (~350k req/s).

### Solution

If middleware processing (auth, logging) is required, use standard `app.get()` route registration instead.

---

## ⏱️ 25. Cache Middleware Serving Expired Responses

### Symptom

`cache({ ttlMs: 5000 })` returns stale data past 5 seconds.

### Root Cause

System clock drift or modified `ttlMs` setting on dynamic routes.

### Solution

Verify system clock and set explicit TTL options on cache middleware instance.

---

## 🛡️ 26. CSRF Token Validation Failed (`403 Forbidden`)

### Symptom

POST request rejected with `Invalid CSRF Token`.

### Root Cause

CSRF token in request header does not match value in cookie.

### Solution

Pass token in header `X-CSRF-Token` matching the cookie from `ctx.csrfToken()`. Same-origin `Origin` must match `Host`. Query-string `_csrf` is ignored.

---

## 🔌 27. WebSocket Upgrade Header Rejection

### Symptom

`400 Bad Request` when connecting to WebSocket endpoint.

### Root Cause

Missing `Upgrade: websocket` header in client handshake.

### Solution

Ensure client connects using standard WebSocket protocol (`ws://` or `wss://`).

---

## 🍪 28. Cross-Site Cookies Blocked in Chrome

### Symptom

Cookies set by API backend are not sent by browser frontend on different domain.

### Root Cause

Missing `SameSite=None; Secure` attributes on cookie.

### Solution

```javascript
ctx.setCookie("token", value, {
  sameSite: "none",
  secure: true,
  httpOnly: true,
});
```

---

## 🚀 29. Cluster Worker Process Exiting (`Worker Died`)

### Symptom

Cluster worker terminates unexpectedly under heavy load.

### Root Cause

Uncaught exception in single worker process.

### Solution

Respawn dead workers automatically in master process:

```javascript
import cluster from "node:cluster";

if (cluster.isPrimary) {
  cluster.on("exit", () => cluster.fork());
}
```

---

## 📦 30. N-API Addon Version Mismatch (`NODE_MODULE_VERSION`)

### Symptom

```text
Error: The module 'velociradix.node' was compiled against a different Node.js version.
```

### Root Cause

Binary compiled on different Node.js major version (e.g. Node 18 vs Node 22).

### Solution

Recompile addon for current active Node.js runtime:

```bash
npm rebuild velociradix
```

---

## 🔄 31. `autoRoute` Changes Not Detected by `tsx watch`

### Symptom

Creating or modifying route files inside `routes/` does not trigger hot-reloading when running `npx tsx watch server.ts`.

### Root Cause

`tsx watch` builds a static dependency graph from `server.ts`. Because `autoRoute` scans and imports modules dynamically at runtime, `tsx watch` does not automatically track the `routes/` folder unless instructed.

### Solution

Pass `--include` to watch the `routes/` directory explicitly:

```bash
npx tsx watch --include "routes/**" server.ts
# Or with native Node.js 20+:
node --watch --watch-path=routes server.ts
```

---

## ⚡ 32. `autoRouteAsync` / New Features Not Found in Consumer Project

### Symptom

`Property 'autoRouteAsync' does not exist on type 'App'` when running in a separate demo project.

### Root Cause

The consumer project installed `velociradix` from the public npm registry (`npm install velociradix@latest`), which has not yet received unreleased local changes.

### Solution

Link or install the local workspace folder in your project:

```bash
npm install ../velociradix
```

---

## 🌐 33. VitePress 404 on `.html` Extension in Dev Server

### Symptom

Navigating to `http://localhost:5173/Velociradix/guide/routing.html` returns a 404 page.

### Root Cause

In development mode (`npm run docs:dev`), VitePress serves routes as **Clean URLs** (without the `.html` extension).

### Solution

Open the clean URL without `.html`:

```text
http://localhost:5173/Velociradix/guide/routing
```

---

## 🧵 34. Throughput Drop on Single-Core or Low-End Hardware

### Symptom

Benchmark req/s drops when setting high worker counts on a 1-core VPS or laptop.

### Root Cause

Spawning multiple C++ worker threads on 1 CPU core causes high OS thread context-switching and mutex lock contention on the single Node.js V8 event loop.

### Solution

Auto-tune or set worker count to 1 for low-spec machines:

```javascript
app.setWorkers(1);
```

---

## 📦 35. `ctx.body()` Returns `null` on Large Payloads (`413 Payload Too Large`)

### Symptom

Request body is empty or fails when uploading JSON/binary larger than 1MB.

### Root Cause

Velociradix enforces a default payload protection limit to prevent Out-Of-Memory denial of service.

### Solution

Increase the payload size limit during server setup:

```javascript
app.setPayloadLimit(10 * 1024 * 1024); // 10MB
```

---

## ♻️ 36. `ctx.params` or `ctx.ip` Overwritten Inside `setTimeout`

### Symptom

Accessing `ctx.params.id` inside `setTimeout(() => { ... }, 1000)` returns values from a different request or `undefined`.

### Root Cause

Velociradix recycles `Context` objects in a high-speed memory pool (`Object Pooling`) as soon as the HTTP response finishes.

### Solution

Copy all required request values into local variables before starting asynchronous background tasks:

```javascript
app.get("/task/:id", (ctx) => {
  const taskId = ctx.params.id; // Copy value!
  setTimeout(() => {
    console.log("Processing task:", taskId);
  }, 1000);
  return ctx.json({ queued: true });
});
```

---

## 🛡️ 37. Client IP Always Shows `127.0.0.1` Behind NGINX or Cloudflare

### Symptom

`ctx.ip` and `rateLimit()` treat all incoming users as the same proxy IP `127.0.0.1`.

### Root Cause

Velociradix ignores `X-Forwarded-For` headers by default to protect against IP spoofing.

### Solution

Enable proxy trust mode in your application:

```javascript
app.setTrustProxy(true);
```

---

## 📡 38. Server-Sent Events (SSE) Buffering in NGINX Reverse Proxy

### Symptom

SSE event stream (`ctx.sseInterval`) delays events and sends them all at once when connection closes.

### Root Cause

NGINX buffers response stream chunks by default.

### Solution

Set `X-Accel-Buffering: no` and `Cache-Control: no-cache`:

```javascript
app.get("/events", (ctx) => {
  ctx.setHeader("X-Accel-Buffering", "no");
  return ctx.sseInterval(() => ({ data: "update" }), 1000);
});
```

---

## 📘 39. Missing TypeScript Types (`@types/node` Missing)

### Symptom

TypeScript compiler errors on `Socket`, `Buffer`, or `EventEmitter` types.

### Root Cause

`@types/node` is missing from project devDependencies.

### Solution

Install Node.js types:

```bash
npm install -D @types/node typescript
```

---

## ⚠️ 40. Mixing `res.send()` and Returning Values in Express Shim

### Symptom

`Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`.

### Root Cause

Calling `res.send()` inside an Express middleware and also returning a value from the Velociradix route handler.

### Solution

Choose one response pattern per request:

```javascript
// Pattern A: Native return
app.get("/api", (ctx) => ctx.json({ ok: true }));

// Pattern B: Express shim
app.get("/api", (ctx) => {
  ctx.res.status(200).send("ok");
});
```
