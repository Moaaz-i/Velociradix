# Performance & Benchmarks

Velociradix is engineered for minimum latency and maximum requests per second.

---

## 📊 Benchmark Results

Benchmarked on Apple M1 (ARM64) using `autocannon` with **500,000 requests**, **100 concurrent connections**, and **10 HTTP pipelining**:

| Engine / Framework | GET `/json` (RPS) | Avg Latency | Rank |
| :--- | :---: | :---: | :---: |
| 🚀 **Velociradix (`fastGet`)** | **114,490 req/s** ⚡ | **8.26 ms** | 🥇 **#1 Winner** |
| ⚡ **Fastify** | 41,605 req/s | 23.55 ms | 🥈 #2 |
| ⚡ **Velociradix (Standard)** | **19,915 req/s** ⚡ | **50.26 ms** | 🥉 **#3 (nearly 2x Express)** |
| 🐌 **Express** | 11,503 req/s | 88.04 ms | #4 |

> 💡 **Tip:** Remember to disable console logging (`logger()`) during production benchmark runs to prevent stdout I/O bottlenecks and achieve maximum throughput.

---

## ⚡ C++ Fast-Path (`fastGet`, `fastPost`, `fastRoute`)

When registering routes via `app.fastGet()`, static or pre-calculated JSON responses are served **directly from native C++ memory**, completely bypassing the Node.js V8 JS event loop and avoiding GC overhead.

```js
// Served at 120,000+ req/s directly in native C++ memory
app.fastGet('/health', { status: 'ok', engine: 'velociradix' });
app.fastGet('/ping', 'pong');
```
