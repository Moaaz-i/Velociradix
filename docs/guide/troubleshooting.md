# Troubleshooting & Common Issues (30 Problems & Solutions)

A comprehensive, production-tested diagnostic guide to 30 real-world errors, edge cases, and solutions when developing and deploying with **Velociradix**.

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
import { createApp, cors } from 'velociradix';
const app = createApp();

app.use(cors({ origin: '*' }));
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
Use `path.resolve` or `path.join` to normalize file paths before passing to `ctx.sendFile`:
```javascript
import { resolve } from 'node:path';
const safePath = resolve('./public', reqPath.replace(/^\//, ''));
return ctx.sendFile(safePath);
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
ctx.setEncryptedCookie('session', data, SECRET_KEY, { httpOnly: true });
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
  console.error('Unhandled Route Error:', err);
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
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
app.serveStatic('/static', join(__dirname, 'public'));
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
declare module 'velociradix' {
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
return ctx.renderHtml('<h1>Hello {{ name }}</h1>', { name: safeName });
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
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

app.useExpress(upload.single('avatar'));
app.post('/upload', (ctx) => ctx.json({ file: ctx.req.file }));
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
  ctx.sseSend(': heartbeat\n\n');
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
Pass token in header `X-CSRF-Token` matching cookie value generated by `ctx.csrfToken()`.

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
ctx.setCookie('token', value, { sameSite: 'none', secure: true, httpOnly: true });
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
import cluster from 'node:cluster';

if (cluster.isPrimary) {
  cluster.on('exit', () => cluster.fork());
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
