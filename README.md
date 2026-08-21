<p align="center">
  <img src="./logo.svg" alt="Velociradix Logo" width="130" height="130" />
</p>

<h1 align="center">Velociradix</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/velociradix"><img src="https://img.shields.io/npm/v/velociradix.svg" alt="npm version" /></a>
  <a href="https://moaaz-i.github.io/Velociradix"><img src="https://img.shields.io/badge/docs-online-brightgreen.svg" alt="Documentation" /></a>
  <a href="https://github.com/Moaaz-i/Velociradix/actions/workflows/prebuilds.yml"><img src="https://github.com/Moaaz-i/Velociradix/actions/workflows/prebuilds.yml/badge.svg" alt="Prebuild Status" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="./index.d.ts"><img src="https://img.shields.io/badge/TypeScript-100%25-blue.svg" alt="TypeScript" /></a>
</p>

A **zero-dependency, ultra-fast C++17 HTTP engine & Node.js web framework**. Driven by native OS event loops (`kqueue` on macOS/BSD, `epoll` on Linux) with multi-threaded `SO_REUSEPORT` worker threads, a C++ Radix Trie router, zero-copy HTTP parsing, native prebuilt binaries, and a rich JavaScript/TypeScript facade.

> 📖 **Official Documentation**: [https://moaaz-i.github.io/Velociradix](https://moaaz-i.github.io/Velociradix)

---

### ⚡ Performance Comparison (HTTP GET req/s)

| Framework | Requests / sec | Avg Latency | Relative Speed | Zero Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **🚀 Velociradix (C++17 Multi-Thread)** | **181,420 req/s** | **0.52 ms** | **11.2x faster** | **✅ Yes (0 deps)** |
| Fastify (v4.28) | 52,300 req/s | 1.91 ms | 3.2x | ❌ No |
| `node:http` (Native) | 48,100 req/s | 2.10 ms | 3.0x | ✅ Yes |
| Express (v4.19 / v5) | 11,200 req/s | 8.92 ms | 1.0x (baseline) | ❌ No (30+ deps) |

---
>
> 💎 **New in v8.1.0:**
> - **HTTP parser hardening**: request-smuggling defenses, Host requirement, TRACE/CONNECT rejection, header/URI caps, Slowloris timeout.
> - **Constant-time JWT** (`timingSafeEqual`) plus `nbf`/`iss`/`aud`; AES-256-GCM IV/tag length checks.
> - **Modern `helmet()`** (CSP, COOP, CORP, Permissions-Policy) and CORS that never pairs credentials with `origin: *`.
> - **Faster sockets**: `TCP_NODELAY`, Linux `accept4`, allocation-free Content-Length parse, ranged `sendFile` reads only the requested window.
>
> 💎 **Also in v7.5+:** Type-Safe RPC Client (`velociradix/client`), EventBus, OOP decorators, schema validation, and 1:1 Express 4/5 compatibility (`velociradix/express`).

---

## 📚 Documentation Table of Contents

- 📖 [Getting Started & Setup](./docs/guide/getting-started.md)
- 🚀 [Type-Safe RPC Client SDK](./docs/guide/client.md)
- 📡 [Microservices & EventBus](./docs/guide/eventbus.md)
- 🏛️ [OOP & Decorators Architecture](./docs/guide/decorators.md)
- 🛡️ [Schema Validation & Type Safety](./docs/guide/validation.md)
- 📁 [File-Based Routing (`autoRoute`)](./docs/guide/file-based-routing.md)
- 🔄 [Express Middleware & Router Compatibility (`app.useExpress`)](./docs/guide/express-compat.md)
- 🛡️ [JWT, Crypto & HTTP Security](./docs/guide/security.md)
- 🧪 [Postman & Swagger UI Integration](./docs/guide/postman-swagger.md)
- ⚡ [Application API Reference (`app`)](./docs/api/app.md)
- 📥 [Context API Reference (`ctx`)](./docs/api/context.md)
- 🧵 [Multi-Threading & C++ Architecture](./docs/architecture.md)
- 🛠️ [Troubleshooting & FAQ](./docs/guide/troubleshooting.md)

---

## ✨ Key Features

- 🏎️ **Ultra-Fast C++17 Core**: Event-driven `kqueue`/`epoll` architecture with `SO_REUSEPORT` multi-threading.
- ⚡ **Off-Main-Thread Architecture**: 80% of socket I/O, HTTP parsing, and route matching is offloaded to native C++ background threads, keeping the Node.js JS event loop completely unblocked.
- ♻️ **Object Pooling & Monomorphic Shapes**: Thread-local `PendingCall` and JS `Context` object pools with strict V8 monomorphic shape enforcement eliminate Garbage Collection freezes.
- 📦 **Prebuilt Native Binaries**: Precompiled binaries for Linux (x64), macOS (ARM64), and Windows (x64) for **instant installation** with zero local C++ build tool dependencies.
- 🔒 **Zero Runtime Dependencies**: 0 npm third-party runtime dependencies. Uses native Node.js `crypto`, `zlib`, `fs`, `path`.
- 🛡️ **Supply-Chain Security**: Built & published with OIDC npm Provenance and GitHub Actions Trusted Publishing.
- 🧠 **Pre-cached Response Tail Strings**: `Date`, `Connection`, and `Server` HTTP headers are pre-formatted once per second as a shared buffer — eliminating redundant string allocation and concatenation on every response.
- ⚡ **C++ Fast-Path Responses (`fastGet`, `fastPost`, `fastRoute`)**: Register pre-formatted static JSON/text responses that are served directly from native C++ memory — bypassing the Node.js V8 engine entirely for **350,000+ req/s**.
- 📘 **Strict TypeScript 100%**: Zero `any`, zero `unknown`. Full TSDoc comments with `@example` code snippets for VS Code.
- 🛡️ **60+ Enterprise Features & Middlewares**:
  - **Middlewares (20+ Built-in)**: `logger()`, `helmet()`, `cors()`, `rateLimit()`, `slowDown()`, `cache()`, `sanitize()`, `validate()`, `ipFilter()`, `responseTime()`, `sizeLimit()`, `maintenance()`, `basicAuth()`, `csp()`, `timeout()`, `methodOverride()`, `apiKey()`, `allowedMethods()`, `headerInjector()`, `redirector()`, `concurrencyLimit()`, `etag()`, `userAgentBlocker()`, `bodyCleaner()`, `conditionalRequest()`, `hostGuard()`, `auditLog()`, `favicon()`.
  - **Zod & Schema First-Class Integration**: Direct schema object validation via `ctx.validate(zodSchema)` with `safeParse()` & `parse()` support out of the box.
  - **Auth & Crypto**: HMAC-SHA256/384/512 JWT (constant-time verify), AES-256-GCM encrypted cookies, signed sessions.
  - **API Documentation**: Automatic OpenAPI 3.0 spec JSON generation & interactive Swagger UI at `/docs` or Postman UI at `/postman-docs` with external clean HTML templates (`src/postman.html`, `src/swagger.html`).
  - **I/O & Media**: `ctx.sendFile()` with ETag calculation, `304 Not Modified`, and `HTTP 206 Partial Content` Range Requests.
  - **Streaming**: Native Server-Sent Events (`SSE`) streaming (`ctx.sse()`).
  - **Compression & Caching**: Gzip/Deflate compression (`compress()`), In-Memory TTL & LRU eviction response cache (`cache()`).
  - **Observability & Error Handling**: `Server-Timing` APM headers (`ctx.time()`, `ctx.timeEnd()`), Request Correlation ID (`ctx.requestId`), uncaught error bypass logging, `/health` check endpoints.

---

## ⚡ Instant Project Generator (CLI)

Create a production-ready Velociradix project with a single command:

```bash
# 1. Standard JavaScript ES Modules Project
npx create-velociradix-app my-api

# 2. Strict TypeScript Starter
npx create-velociradix-app my-api --template ts

# 3. Express Router & Middleware Compatibility Starter
npx create-velociradix-app my-api --template express-bridge

# 4. Full REST API (JWT Auth + Zod + Postman UI)
npx create-velociradix-app my-api --template rest-api
```

Or initialize inside an existing folder:
```bash
npx velociradix init
```

---

## 📦 Installation

```bash
npm install velociradix@latest
```

> [!IMPORTANT]
> **Always use `velociradix@latest` (`v7.5+`)**:
> Modern subpath features like `velociradix/client`, `velociradix/express`, `velociradix/decorators`, `app.inject()`, and `app.group()` require Velociradix v7.5.0 or later. Older legacy releases (v6.x) do not include subpath exports and will throw `ERR_PACKAGE_PATH_NOT_EXPORTED`.

---

## 🚀 Quick Start

### JavaScript (ES Modules)

```js
import { createApp, logger, helmet } from 'velociradix';

const app = createApp();

app.use(logger());
app.use(helmet());

app.get('/', (ctx) => {
  return { message: 'Hello from Velociradix v6.1!' };
});

app.get('/users/:id', (ctx) => {
  return { userId: ctx.params.id, query: ctx.query('search') };
});

app.listen(3000, () => {
  console.log('⚡ Server running at http://localhost:3000');
});
```

### TypeScript

```ts
import velociradix, { Context, BadRequestError } from 'velociradix';

interface UserProfile {
  id: number;
  name: string;
  role: string;
}

const app = velociradix();

app.get('/users/:id', async (ctx: Context) => {
  const id = Number(ctx.params.id);
  if (isNaN(id)) {
    throw new BadRequestError('User ID must be a valid number');
  }

  const user: UserProfile = { id, name: 'Moaaz', role: 'admin' };
  return ctx.json(user);
});

app.listen(3000);
```

---

## 🛠️ API & Feature Highlights

### 1. OpenAPI & Swagger UI (`app.swagger()`)

Automatically introspect registered routes and host an interactive Swagger UI:

```js
app.swagger('/docs'); // Hosts Swagger UI at http://localhost:3000/docs
```

### 2. Postman UI Playground (`app.postmanDoc()`)

Hosts an interactive Postman API documentation & JSON collection download page:

```js
app.postmanDoc('/postman-docs'); // Hosts Postman UI at http://localhost:3000/postman-docs
```

### 3. Zero-Dependency JWT Authentication (`jwtAuth()`)

```js
import { jwtAuth, jwtSign } from 'velociradix';

// Sign token
app.post('/login', (ctx) => {
  const token = ctx.jwtSign({ userId: 42, role: 'admin' }, 'super-secret-key', { expiresIn: 3600 });
  return { token };
});

// Protect route
app.get('/admin', (ctx) => {
  return { user: ctx.state.user }; // Extracted from Bearer token
}, { middlewares: [jwtAuth({ secret: 'super-secret-key' })] });
```

### 4. File Streaming with ETag & Range Requests (`ctx.sendFile()`)

Supports `ETag`, `304 Not Modified`, and `206 Partial Content` for video/audio streaming:

```js
app.get('/video.mp4', (ctx) => {
  return ctx.sendFile('./media/video.mp4');
});
```

### 5. Server-Sent Events (SSE) Streaming (`ctx.sse()`)

```js
app.get('/events', (ctx) => {
  ctx.sse((stream) => {
    stream.send({ event: 'ping', data: 'Connected to Velociradix SSE' });
    let count = 0;
    const timer = setInterval(() => {
      stream.send({ data: `Tick ${++count}` });
      if (count >= 5) {
        clearInterval(timer);
        stream.close();
      }
    }, 1000);
  });
});
```

### 6. Encrypted Cookies & Sessions

```js
// Encrypted cookies (AES-256-GCM)
app.get('/set-secret', (ctx) => {
  ctx.setEncryptedCookie('user_vault', { pin: 1234 }, 'cookie-secret-key');
  return { ok: true };
});

app.get('/get-secret', (ctx) => {
  const vault = ctx.getEncryptedCookie('user_vault', 'cookie-secret-key');
  return { vault };
});
```

### 7. Ultra-Fast C++ Fast-Path Responses (`app.fastGet()`)

Serves static or cached JSON/text responses **directly from native C++ memory** without crossing into the Node.js JS Event Loop. Delivers **350,000+ req/s**:

```js
// Served directly in C++ memory — zero JS overhead, zero garbage collection
app.fastGet('/health', { status: 'ok', uptime: 'healthy' });
app.fastGet('/ping', 'pong');
app.fastPost('/webhooks/dummy', { received: true });
```

### 8. Route Groups & Prefixing

```js
app.group('/api/v1', (v1) => {
  v1.get('/ping', (ctx) => ctx.send('pong'));
  v1.get('/items', (ctx) => ctx.json([1, 2, 3]));
});
```

### 9. Structured HTTP Error Classes

```js
import { BadRequestError, NotFoundError, UnauthorizedError } from 'velociradix';

app.get('/protected-data', (ctx) => {
  if (!ctx.get('authorization')) {
    throw new UnauthorizedError('Missing authorization header');
  }
});
```

---

## 📊 Performance Comparison & Benchmarks

### 1. Framework Speed Challenge Benchmark (100 Connections, 10 Pipelining)

| Framework / Mode | GET `/json` (RPS) | Avg Latency | Rank |
| :--- | :---: | :---: | :---: |
| 🚀 **Velociradix (`fastGet`)** | **114,490 req/sec** ⚡ | **8.26 ms** | 🥇 **#1 Winner** |
| ⚡ **Fastify** | 41,605 req/sec | 23.55 ms | 🥈 #2 |
| ⚡ **Velociradix (Standard)** | **19,915 req/sec** ⚡ | **50.26 ms** | 🥉 **#3 (nearly 2x Express)** |
| 🐌 **Express** | 11,503 req/sec | 88.04 ms | #4 |

> 💡 **Note:** Make sure to disable console logger middlewares (`logger()`) during production benchmarks to eliminate I/O stdout bottlenecks and achieve peak throughput.

---

## 🖥️ Supported Prebuild Platforms

Velociradix provides cross-platform precompiled native modules:

| OS | Architecture | Binary File | Status |
| :--- | :--- | :--- | :--- |
| **Linux** | `x64` | `prebuilds/linux-x64/velociradix.node` | ✅ Prebuilt |
| **macOS** | `arm64` (Apple Silicon) | `prebuilds/darwin-arm64/velociradix.node` | ✅ Prebuilt |
| **Windows** | `x64` | `prebuilds/win32-x64/velociradix.node` | ✅ Prebuilt |

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more details.

