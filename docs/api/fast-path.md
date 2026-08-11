# Fast-Path C++ Static Routes (`fastGet`, `fastPost`, `fastRoute`)

For ultra-critical high-throughput endpoints (like `/health`, `/ping`, or static JSON metrics), Velociradix allows you to serve pre-formatted responses **directly from C++ native memory**.

---

## Why Fast-Path?

Standard HTTP frameworks execute Node.js V8 JavaScript callbacks for every single request, causing Garbage Collection allocations and CPU context switches. 

Fast-Path routes deliver **350,000+ req/s** by processing the response inside C++ background threads before reaching Node's V8 event loop.

---

## Code Examples

### 1. Fast GET Route (`app.fastGet`)

```js
import { createApp } from 'velociradix';

const app = createApp();

// Serves static JSON response at 120,000+ req/s with zero JS memory allocation
app.fastGet('/health', { status: 'ok', uptime: 'healthy' });

// Plain text response
app.fastGet('/ping', 'pong');
```

### 2. Fast POST Route (`app.fastPost`)

```js
app.fastPost('/webhook/acknowledge', { received: true, status: 200 });
```

### 3. Fast Generic Route (`app.fastRoute`)

```js
app.fastRoute('GET', '/api/v1/config', {
  env: 'production',
  version: '6.1.3'
}, 200, { 'Cache-Control': 'public, max-age=3600' });
```
