# Comprehensive Features Guide

Velociradix is built from the ground up for extreme throughput, zero runtime dependency overhead, full enterprise readiness, and complete TypeScript type safety without `any`.

---

## ⚡ Core Engine Architecture

| Component                 | Technical Implementation                                | Benefit                                                                            |
| :------------------------ | :------------------------------------------------------ | :--------------------------------------------------------------------------------- |
| **Event Multiplexer**     | `kqueue` (macOS/BSD), `epoll` (Linux), `IOCP` (Windows) | Non-blocking event-driven network I/O with $O(1)$ event notifications.             |
| **Radix Trie Router**     | Pure C++17 Radix Tree                                   | $O(K)$ parameter and wildcard route lookup regardless of route count.              |
| **Object Pooling**        | V8 Monomorphic Shape Pools                              | Zero Garbage Collection shape churn on `Context` and `Request` wrappers.           |
| **Response Tail Caching** | Shared 1-Second Format Buffers                          | Eliminates redundant string allocations for `Date`, `Server`, and `Connection`.    |
| **Fast-Path Engine**      | `fastGet`, `fastPost`, `fastRoute`                      | Bypasses V8 execution entirely to serve static JSON/text directly from C++ memory. |
| **HTTP Parser**           | RFC 7230 tchar + smuggling guards                       | Rejects TE+CL, duplicate Content-Length, obs-fold, TRACE; 32 KiB header cap.       |
| **Socket Tuning**         | `TCP_NODELAY`, Linux `accept4`                          | Immediate small-response flush; one-syscall accept on Linux.                       |

---

## 🔀 1. Multi-Version API Router (`app.versioning()`)

Seamlessly handle multiple API versions via headers (e.g. `X-API-Version: v2`) or path prefixes (`/v1`, `/v2`):

```javascript
app.versioning(
  {
    v1: appV1,
    v2: appV2,
  },
  { headerName: "x-api-version" },
);
```

---

## 📡 2. Type-Safe JSON-RPC 2.0 Engine (`app.rpc()`)

Registers lightweight JSON-RPC endpoints for direct frontend-to-backend procedure execution:

```javascript
app.rpc("/rpc", {
  multiply: ({ a, b }) => a * b,
  getUser: ({ id }, ctx) => ({ id, name: "Alice" }),
});
```

---

## 📊 3. Terminal CLI Route Printer (`app.printRoutes()`)

Prints a clean, formatted ASCII route table to the terminal showing all registered methods and endpoints:

```javascript
app.printRoutes();
```

---

## ⏳ 4. Automated Periodic SSE Ticker (`ctx.sseInterval()`)

Streams periodic real-time Server-Sent Events at configured time intervals:

```javascript
app.get("/live-prices", (ctx) => {
  return ctx.sseInterval(() => ({ price: Math.random() * 100 }), 1000);
});
```

---

## 🔐 5. Granular Dynamic Rate Limiter (`rateLimitByKey()`)

Restricts request rate dynamically based on custom keys (e.g. User ID, API Key, Tenant ID):

```javascript
import { rateLimitByKey } from "velociradix";

app.use(
  rateLimitByKey({
    max: 100,
    windowMs: 60000,
    keyFn: (ctx) => ctx.get("x-api-key") || ctx.ip,
  }),
);
```

---

## 📁 6. File-System Based Auto Routing (`app.autoRoute()`)

Automatically scans routes directories recursively and maps exported route functions (`GET`, `POST`, `PUT`, `DELETE`, etc.) or default handlers to HTTP paths:

```javascript
// Scans ./routes directory recursively
app.autoRoute("./routes");
```

---

## 🔌 7. Native WebSockets Support (`app.ws()`)

Zero-dependency HTTP Upgrade to WebSocket connections with client broadcasting:

```javascript
app.ws("/chat", (socket) => {
  socket.send("Welcome to Velociradix WS!");

  socket.broadcast("A new user joined the chat room");

  socket.on("message", (msg) => {
    console.log("Received:", msg);
  });
});
```

---

## 🔮 8. Integrated GraphQL Engine (`app.graphql()`)

Query and mutation execution engine directly inside Velociradix:

```javascript
app.graphql("/graphql", `type Query { user(id: ID!): User }`, {
  user: (ctx) => ({ id: ctx.params.id || 1, name: "Alice", role: "admin" }),
});
```

---

## 📡 9. Multi-Channel SSE Broadcast (`app.sseBroadcast()`)

Stream named events to connected clients across specific broadcast channels:

```javascript
// Broadcast to all clients subscribed to 'live-feed'
app.sseBroadcast("live-feed", { timestamp: Date.now(), activeUsers: 142 });
```

---

## 🛡️ 10. Circuit Breaker Resiliency Middleware (`circuitBreaker()`)

Protects external database or microservice endpoints with failure threshold monitoring and state transition (Closed, Open, Half-Open):

```javascript
import { circuitBreaker } from "velociradix";

app.use(circuitBreaker({ failureThreshold: 5, resetTimeoutMs: 10000 }));
```

---

## 🎭 11. Built-in API Mocking Engine (`app.mockServer()`)

Registers mock endpoints with simulated latency delay for frontend integration:

```javascript
app.mockServer({
  "GET /api/users": {
    status: 200,
    delayMs: 100,
    body: [{ id: 1, name: "Alice" }],
  },
  "POST /api/orders": { status: 201, delayMs: 200, body: { orderId: 99 } },
});
```

---

## ⏱️ 12. Fluent HTTP Cache-Control Helper (`ctx.cacheControl()`)

Expressive helper for `max-age`, `s-maxage`, `stale-while-revalidate`, `public`, `private`, and `immutable` headers:

```javascript
app.get("/assets/logo.png", (ctx) => {
  ctx.cacheControl({ maxAge: 3600, public: true, staleWhileRevalidate: 86400 });
  return ctx.sendFile("./public/logo.png");
});
```

---

## ⚡ 13. Programmatic Load Tester & Benchmark Runner (`app.bench()`)

Runs local throughput (RPS) and latency benchmarking:

```javascript
const stats = await app.bench({ iterations: 1000, path: "/api/users" });
console.log(`RPS: ${stats.rps} req/sec | Total Time: ${stats.totalMs} ms`);
```

---

## 🧠 14. Dynamic Auto-Scaling Worker Threads (`app.autoScale()`)

Dynamically adjusts native C++ worker thread pool allocation based on system heap memory and load:

```javascript
app.autoScale({ minWorkers: 2, maxWorkers: 8, intervalMs: 5000 });
```
