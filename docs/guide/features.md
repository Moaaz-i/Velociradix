# Comprehensive Features Guide

Velociradix is built from the ground up for extreme throughput, zero runtime dependency overhead, and full enterprise readiness.

> [!TIP]
> **New in v7.0.0**: Includes `velociradix/express` drop-in replacement, interactive Live Metrics UI dashboard, OpenAPI 3.0 & Postman JSON exporters, graceful shutdown hooks, and sliding-window rate limiting enhancements.

---

## ⚡ Core Engine Architecture

| Component | Technical Implementation | Benefit |
| :--- | :--- | :--- |
| **Event Multiplexer** | `kqueue` (macOS/BSD), `epoll` (Linux), `IOCP` (Windows) | Non-blocking event-driven network I/O with $O(1)$ event notifications. |
| **Radix Trie Router** | Pure C++17 Radix Tree | $O(K)$ parameter and wildcard route lookup regardless of route count. |
| **Object Pooling** | V8 Monomorphic Shape Pools | Zero Garbage Collection shape churn on `Context` and `Request` wrappers. |
| **Response Tail Caching** | Shared 1-Second Format Buffers | Eliminates redundant string allocations for `Date`, `Server`, and `Connection`. |
| **Fast-Path Engine** | `fastGet`, `fastPost`, `fastRoute` | Bypasses V8 execution entirely to serve static JSON/text directly from C++ memory. |

---

## 🏎️ 1. Express Drop-In Replacement (`velociradix/express`)

Upgrade legacy Express codebases instantly by replacing the import line:

```javascript
// Change: import express from 'express';
import express from 'velociradix/express';

const app = express();
app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'Alice' }]);
});

app.listen(3000);
```

---

## 🛡️ 2. Built-In Request Validation (`ctx.validate()`)

High-performance validation for request body, parameters, and query parameters:

```javascript
app.post('/api/users', (ctx) => {
  const data = ctx.validate({
    username: { type: 'string', required: true, min: 3 },
    email: { type: 'email', required: true },
    age: { type: 'number', min: 18, max: 99 }
  });
  return ctx.json({ status: 'user created', data });
});
```

---

## 📊 3. Live Metrics & Health Dashboard (`app.metricsUI()`)

Mounts an embedded, zero-dependency HTML dashboard displaying real-time system metrics:

```javascript
// Accessible at http://localhost:3000/velociradix/metrics
app.metricsUI('/velociradix/metrics');
```

> [!NOTE]
> Returns live JSON metrics at `/velociradix/metrics/json` for integration with external monitoring systems (Prometheus, Datadog).

---

## 🌐 4. Automated OpenAPI 3.0 & Postman Collection Exporters

Export production-ready API documentation specifications dynamically:

```javascript
// 1. Export OpenAPI 3.0 Spec JSON
const openapiSpec = app.exportOpenAPI({ title: 'Production API Spec', version: '1.0.0' });

// 2. Export Postman Collection v2.1.0 JSON
const postmanCollection = app.exportPostman('Production API Collection');
```

---

## ⚙️ 5. Graceful Shutdown Hooks (`app.onShutdown()`)

Register cleanup callbacks to close database connections and clear timers cleanly on `SIGINT` / `SIGTERM`:

```javascript
app.onShutdown(async () => {
  console.log('Closing database connection pools...');
  await db.disconnect();
});

app.gracefulShutdown();
```

---

## 🔒 6. Enterprise Security & Middleware Suite

Velociradix includes **over 25 built-in production-grade middlewares**:

1. **`logger()`**: Color-coded HTTP request logger with response timing and status indicators.
2. **`helmet()`**: Injects HTTP security headers (`X-Frame-Options`, `HSTS`, `CSP`, `Referrer-Policy`).
3. **`cors()`**: Manages CORS preflight (`OPTIONS`) and cross-origin resource sharing.
4. **`rateLimit()`**: IP-based sliding window rate limiter with auto garbage collection.
5. **`slowDown()`**: Progressive delay throttler for repeated requests.
6. **`cache()`**: In-memory response cache with TTL & LRU eviction.
7. **`sanitize()`**: XSS input sanitizer for query strings and path parameters.
8. **`jwtAuth()` & `bearerAuth()`**: Bearer token and HMAC-SHA256 JWT verification.
9. **`session()`**: AES-256-CBC cookie-backed encrypted user session store.
10. **`ipFilter()`**: IP whitelist and blacklist firewall middleware.
11. **`responseTime()`**: High-resolution `X-Response-Time` header injector.
12. **`sizeLimit()`**: Enforces payload size limits to protect against memory exhaustion.
13. **`basicAuth()`**: HTTP Basic Authentication guard.
14. **`timeout()`**: Enforces maximum execution timeout per route.
15. **`concurrencyLimit()`**: Dynamic request throttler for high-load protection.
