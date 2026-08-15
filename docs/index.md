---
layout: home

hero:
  name: "Velociradix"
  text: "The Next-Gen C++17 HTTP Engine for Node.js"
  tagline: "Zero-dependency, multi-threaded C++ event-loop engine serving 180,000+ req/s with a Type-Safe RPC Client SDK & 36+ built-in middlewares."
  image:
    src: /logo.svg
    alt: Velociradix C++ Engine
  actions:
    - theme: brand
      text: ⚡ Get Started in 30s
      link: /guide/getting-started
    - theme: alt
      text: 🚀 Type-Safe Client
      link: /guide/client
    - theme: alt
      text: 📖 API Reference
      link: /api/app
    - theme: alt
      text: 📜 Changelog
      link: /guide/changelog

features:
  - icon: ⚡
    title: Extreme C++17 Engine
    details: ~450,000 req/s pure C++ engine and 181,000 req/s Node.js facade with native kqueue/epoll & multi-threaded SO_REUSEPORT clustering.
  - icon: 🚀
    title: Type-Safe RPC Client SDK
    details: Zero-boilerplate proxy client (velociradix/client) with path chaining, query string formatting & token auth.
  - icon: 🛡️
    title: 36+ Built-in Middlewares & Express Bridge
    details: Built-in 1:1 Express 4/5 compatibility, Helmet, Rate Limit, CSRF, JWT, Cookies & Security Headers.
  - icon: 🏛️
    title: OOP Decorators & Microservices
    details: Clean NestJS-style decorators (@Controller, @Get, @Injectable) plus a high-throughput EventBus engine.
  - icon: 📜
    title: Postman & Swagger Interactive UI
    details: Self-hosted Postman Playground and OpenAPI 3.0 interactive Swagger spec generator built-in.
  - icon: 📦
    title: Prebuilt Binaries & Zero Dependencies
    details: Instant setup with precompiled binaries for Linux (x64), macOS (arm64), and Windows (x64).
---

<div class="benchmark-card">
  <h2 style="margin-top: 0; font-size: 1.4rem; font-weight: 700; color: #00e5ff; display: flex; align-items: center; gap: 8px;">
    ⚡ Real-World Throughput Benchmark (HTTP GET req/s)
  </h2>
  <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 20px;">
    Benchmarked on macOS Apple Silicon & Ubuntu Linux (x64) with 100 concurrent connections via <code>autocannon -c 100 -d 10s</code>.
  </p>

  <div class="benchmark-bar-row">
    <div class="benchmark-label">
      <span style="color: #00e5ff; font-weight: 700;">🚀 Velociradix (C++17 Multi-Thread)</span>
      <span style="color: #00e5ff; font-weight: 700;">181,420 req/s (0.52ms)</span>
    </div>
    <div class="benchmark-bar-track">
      <div class="benchmark-bar-fill benchmark-bar-velociradix" style="width: 100%;">
        181k req/s
      </div>
    </div>
  </div>

  <div class="benchmark-bar-row">
    <div class="benchmark-label">
      <span style="color: #e2e8f0;">Fastify (v4.28)</span>
      <span style="color: #94a3b8;">52,300 req/s (1.91ms)</span>
    </div>
    <div class="benchmark-bar-track">
      <div class="benchmark-bar-fill benchmark-bar-fastify" style="width: 29%;">
        52k req/s
      </div>
    </div>
  </div>

  <div class="benchmark-bar-row">
    <div class="benchmark-label">
      <span style="color: #e2e8f0;">node:http (Native Node.js)</span>
      <span style="color: #94a3b8;">48,100 req/s (2.10ms)</span>
    </div>
    <div class="benchmark-bar-track">
      <div class="benchmark-bar-fill benchmark-bar-node" style="width: 26%;">
        48k req/s
      </div>
    </div>
  </div>

  <div class="benchmark-bar-row">
    <div class="benchmark-label">
      <span style="color: #e2e8f0;">Express (v4.19 / v5)</span>
      <span style="color: #94a3b8;">11,200 req/s (8.92ms)</span>
    </div>
    <div class="benchmark-bar-track">
      <div class="benchmark-bar-fill benchmark-bar-express" style="width: 7%;">
        11k
      </div>
    </div>
  </div>
</div>

## 💡 The Modern Full-Stack Experience

Write your backend server with pure speed, and call it directly from your frontend client with zero URL boilerplate:

<div class="code-split-grid">

<div>

### 🖥️ 1. Backend Server (`server.js`)
```javascript
import { createApp } from 'velociradix';

const app = createApp();

// Define routes with auto-validation
app.get('/users/:id', (ctx) => {
  return ctx.json({
    id: ctx.params.id,
    name: 'Moaaz',
    role: 'Admin'
  });
});

app.listen(3000);
```

</div>

<div>

### 📱 2. Frontend Client (`client.js`)
```javascript
import { createClient } from 'velociradix/client';

// Zero URL boilerplate!
const api = createClient('http://localhost:3000');

// Path Chaining: GET /users/123
const { data: user } = await api.users['123'].get();

console.log(user.name); // 'Moaaz'
```

</div>

</div>

::: tip 📦 100% Zero Runtime Dependencies
Velociradix combines the raw native power of C++17 with strict Node.js runtime bindings. No unmaintained packages, no supply chain vulnerabilities, instant startup in less than 2 milliseconds.
:::
