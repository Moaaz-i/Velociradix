# ⚡ Velociradix

[![npm version](https://img.shields.io/npm/v/velociradix.svg)](https://www.npmjs.com/package/velociradix)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](./index.d.ts)

A **zero-dependency, ultra-fast C++17 HTTP engine & Node.js framework**. Driven by native OS event loops (`kqueue` on macOS, `epoll` on Linux) with multi-threaded event-loop workers, a C++ Radix Trie router, zero-copy HTTP parsing, and a rich 40-feature JavaScript/TypeScript facade.

> **🚀 Benchmark (500,000 requests, Apple M1, HTTP Pipelining):**
> - **JS / TS Addon Facade**: **181.1k req/s** (**2.4x faster than `node:http`**, **4.5x faster than Express**)
> - **Pure C++ Engine**: **~450k req/s**
>
> 💎 **New in v6.0:** 100% Zero-Copy request parsing & CPU Core Affinity (Thread Pinning) effectively doubling raw latency speeds by eliminating V8 garbage collection overhead!

---

## ✨ Features

- 🏎️ **Ultra-Fast C++17 Core**: Event-driven `kqueue`/`epoll` architecture with `SO_REUSEPORT` multi-threading.
- ⚡ **Monomorphic Inline Caching**: V8 Fast-Path pointer bridge passing IEEE 754 doubles instead of BigInt allocations.
- 🔒 **Zero Dependencies**: Zero npm third-party runtime dependencies. Uses native Node.js `crypto`, `zlib`, `fs`, `path`.
- 📘 **Strict TypeScript 100%**: Zero `any`, zero `unknown`. Full TSDoc comments with `@example` code snippets for VS Code.
- 🛡️ **40 Enterprise Features**:
  - **Security**: `helmet()`, `cors()`, `rateLimit()`, `slowDown()`, `csrf()`, `bearerAuth()`, `jwtAuth()`.
  - **Auth & Crypto**: HMAC-SHA256 JWT sign/verify, AES-256-CBC encrypted cookies, signed sessions.
  - **API Documentation**: Automatic OpenAPI 3.0 spec JSON generation & interactive Swagger UI at `/docs`.
  - **I/O & Media**: `ctx.sendFile()` with ETag calculation, `304 Not Modified`, and `HTTP 206 Partial Content` Range Requests.
  - **Compression & Caching**: Gzip/Deflate compression (`compress()`), In-Memory TTL response cache (`cache()`).
  - **Observability**: `Server-Timing` APM headers (`ctx.time()`, `ctx.timeEnd()`), Request Correlation ID (`ctx.requestId`), `/health` check endpoints.
  - **Developer Experience**: Micro HTML template engine (`ctx.renderHtml()`), XSS sanitizer (`ctx.sanitizeHtml()`), custom HTTP error classes (`BadRequestError`, `NotFoundError`, etc.), Express middleware compatibility (`useExpress`).

---

## 📦 Installation

```bash
npm install velociradix
```

> **Note**: Velociradix automatically compiles the native C++ engine on install using your local C++17 compiler (`clang++` or `g++`).

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
import { createApp, Context, BadRequestError, JsonValue } from 'velociradix';

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

### 4. Encrypted Cookies & Sessions

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

### 5. In-Memory Response Caching (`cache()`)

```js
import { cache } from 'velociradix';

app.get('/trending', (ctx) => {
  return { timestamp: Date.now() };
}, { middlewares: [cache({ ttlMs: 10000 })] });
```

### 6. Route Groups & Prefixing

```js
app.group('/api/v1', (v1) => {
  v1.get('/ping', (ctx) => ctx.send('pong'));
  v1.get('/items', (ctx) => ctx.json([1, 2, 3]));
});
```

### 7. Structured HTTP Error Classes

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
| **`velociradix` (C++ Engine Direct)** | **~450,000 req/s** ⚡ | **~10.0x faster** |
| **`velociradix` (Node.js Addon Facade)** | **181,100 req/s** 🚀 | **~4.5x faster** |
| **`node:http` (Raw Node.js)** | 75,500 req/s | ~1.8x faster |
| **`Fastify`** | 82,000 req/s | ~2.0x faster |
| **`Express`** | 40,000 req/s | 1.0x (Baseline) |

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more details.
