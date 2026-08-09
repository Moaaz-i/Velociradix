# ⚡ Velociradix

[![npm version](https://img.shields.io/npm/v/velociradix.svg)](https://www.npmjs.com/package/velociradix)
[![Prebuild Status](https://github.com/Moaaz-i/Velociradix/actions/workflows/prebuilds.yml/badge.svg)](https://github.com/Moaaz-i/Velociradix/actions/workflows/prebuilds.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](./index.d.ts)

A **zero-dependency, ultra-fast C++17 HTTP engine & Node.js framework**. Driven by native OS event loops (`kqueue` on macOS/BSD, `epoll` on Linux) with multi-threaded `SO_REUSEPORT` worker threads, a C++ Radix Trie router, zero-copy HTTP parsing, native prebuilt binaries, and a rich 40-feature JavaScript/TypeScript facade.

> **🚀 Benchmark (500,000 requests, Apple M1, HTTP Pipelining):**
> - **Pure C++ Engine**: **~450,000 req/s** (**11.2x faster than Express**)
> - **JS / TS Addon (Multi-Thread)**: **181,100 req/s** (**4.5x faster than Express**)
> - **JS / TS Addon (Single-Thread 1 Core)**: **152,900 req/s** (**1.9x faster than `node:http`**, **3.8x faster than Express**)
>
> 💎 **New in v6.0.14:** N-API Batch Dispatch (up to 8 requests dispatched to JS per single TSFN call), Pre-cached HTTP Response Tail strings (no string allocation for `Date` / `Connection` / `Server` headers on hot path), C++ Fast-Path Static Responses (`fastGet`/`fastPost`/`fastRoute`), $O(1)$ Direct File-Descriptor Vector Tables, Thread-Local Object Pooling, 100% Zero-Copy request parsing, Cross-platform native prebuilds (`linux-x64`, `darwin-arm64`, `win32-x64`), and OIDC npm Provenance supply-chain security!

---

## ✨ Features

- 🏎️ **Ultra-Fast C++17 Core**: Event-driven `kqueue`/`epoll` architecture with `SO_REUSEPORT` multi-threading.
- ⚡ **Off-Main-Thread Architecture**: 80% of socket I/O, HTTP parsing, and route matching is offloaded to native C++ background threads, keeping the Node.js JS event loop completely unblocked.
- ♻️ **Object Pooling & Zero-Copy Memory**: Thread-local `PendingCall` and JS `Context` object pools eliminate V8 Garbage Collection freezes and dynamic memory allocations.
- 📦 **Prebuilt Native Binaries**: Precompiled binaries for Linux (x64), macOS (ARM64), and Windows (x64) for **instant installation** with zero local C++ build tool dependencies.
- 🔒 **Zero Runtime Dependencies**: 0 npm third-party runtime dependencies. Uses native Node.js `crypto`, `zlib`, `fs`, `path`.
- 🛡️ **Supply-Chain Security**: Built & published with OIDC npm Provenance and GitHub Actions Trusted Publishing.
- 🧠 **Pre-cached Response Tail Strings**: `Date`, `Connection`, and `Server` HTTP headers are pre-formatted once per second as a shared buffer — eliminating redundant string allocation and concatenation on every response.
- ⚡ **C++ Fast-Path Responses (`fastGet`, `fastPost`, `fastRoute`)**: Register pre-formatted static JSON/text responses that are served directly from native C++ memory — bypassing the Node.js V8 engine entirely for **350,000+ req/s**.
- 📘 **Strict TypeScript 100%**: Zero `any`, zero `unknown`. Full TSDoc comments with `@example` code snippets for VS Code.
- 🛡️ **40 Enterprise Features**:
  - **Security**: `helmet()`, `cors()`, `rateLimit()`, `slowDown()`, `csrf()`, `bearerAuth()`, `jwtAuth()`.
  - **Auth & Crypto**: HMAC-SHA256 JWT sign/verify, AES-256-CBC encrypted cookies, signed sessions.
  - **API Documentation**: Automatic OpenAPI 3.0 spec JSON generation & interactive Swagger UI at `/docs`.
  - **I/O & Media**: `ctx.sendFile()` with ETag calculation, `304 Not Modified`, and `HTTP 206 Partial Content` Range Requests.
  - **Streaming**: Native Server-Sent Events (`SSE`) streaming (`ctx.sse()`).
  - **Compression & Caching**: Gzip/Deflate compression (`compress()`), In-Memory TTL response cache (`cache()`).
  - **Observability**: `Server-Timing` APM headers (`ctx.time()`, `ctx.timeEnd()`), Request Correlation ID (`ctx.requestId`), `/health` check endpoints.
  - **Developer Experience**: Micro HTML template engine (`ctx.renderHtml()`), XSS sanitizer (`ctx.sanitizeHtml()`), custom HTTP error classes (`BadRequestError`, `NotFoundError`, etc.), Express middleware compatibility (`useExpress`).

---

## 📦 Installation

```bash
npm install velociradix
```

> **Note**: Velociradix includes precompiled native binaries (`prebuilds/`) for Linux, macOS, and Windows. If a prebuilt binary for your platform is available, installation is **instant**. Otherwise, it automatically compiles locally using your system's C++17 compiler (`clang++` or `g++`).

---

## 🚀 Quick Start

### JavaScript (ES Modules)

```js
import { createApp, logger, helmet } from 'velociradix';

const app = createApp();

app.use(logger());
app.use(helmet());

app.get('/', (ctx) => {
  return { message: 'Hello from Velociradix v6.0!' };
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
import { createApp, Context, BadRequestError } from 'velociradix';

interface UserProfile {
  id: number;
  name: string;
  role: string;
}

const app = createApp();

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
app.get('/openapi.json', (ctx) => ctx.json(app.openapi({ title: 'My API', version: '6.0.0' })));
```

### 2. Zero-Dependency JWT Authentication (`jwtAuth()`)

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

### 3. File Streaming with ETag & Range Requests (`ctx.sendFile()`)

Supports `ETag`, `304 Not Modified`, and `206 Partial Content` for video/audio streaming:

```js
app.get('/video.mp4', (ctx) => {
  return ctx.sendFile('./media/video.mp4');
});
```

### 4. Server-Sent Events (SSE) Streaming (`ctx.sse()`)

```js
app.get('/events', (ctx) => {
  ctx.sse((stream) => {
    stream.send_event('Connected to Velociradix SSE', 'welcome');
    let count = 0;
    const timer = setInterval(() => {
      stream.send_event(`Tick ${++count}`);
      if (count >= 5) {
        clearInterval(timer);
        stream.close();
      }
    }, 1000);
  });
});
```

### 5. Encrypted Cookies & Sessions

```js
// Encrypted cookies (AES-256-CBC)
app.get('/set-secret', (ctx) => {
  ctx.setEncryptedCookie('user_vault', { pin: 1234 }, 'cookie-secret-key');
  return { ok: true };
});

app.get('/get-secret', (ctx) => {
  const vault = ctx.getEncryptedCookie('user_vault', 'cookie-secret-key');
  return { vault };
});
```

### 6. In-Memory Response Caching (`cache()`)

```js
import { cache } from 'velociradix';

app.get('/trending', (ctx) => {
  return { timestamp: Date.now() };
}, { middlewares: [cache({ ttlMs: 10000 })] });
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

### 8. Structured HTTP Error Classes

```js
import { BadRequestError, NotFoundError, UnauthorizedError } from 'velociradix';

app.get('/protected-data', (ctx) => {
  if (!ctx.get('authorization')) {
    throw new UnauthorizedError('Missing authorization header');
  }
});
```

---

## 📊 Performance Comparison

Measured on Apple Silicon M1 (macOS) with 500,000 requests over 16 keep-alive connections and 16-deep HTTP pipelining:

| Engine / Framework | Throughput (Req/sec) | Relative Speedup vs Express |
| :--- | :--- | :--- |
| **`velociradix` (C++ Engine Direct)** | **~450,000 req/s** ⚡ | **~11.2x faster** |
| **`velociradix` (C++ Fast-Path `fastGet`)** | **350,000+ req/s** 🚀 | **~8.7x faster** |
| **`velociradix` (Node.js Addon Multi-Thread)** | **181,100 req/s** ⚡ | **~4.5x faster** |
| **`velociradix` (Node.js Addon Single-Thread)** | **166,000 req/s** ⚡ | **~4.15x faster** |
| **`Fastify`** | 82,000 req/s | ~2.0x faster |
| **`node:http` (Raw Node.js)** | 75,500 req/s | ~1.8x faster |
| **`Express`** | 40,000 req/s | 1.0x (Baseline) |

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
