---
layout: home

hero:
  name: "Velociradix"
  text: "Ultra-Fast C++17 HTTP Engine & Node.js Framework"
  tagline: Zero-dependency, event-driven (kqueue/epoll), multi-threaded C++ engine serving 180,000+ req/s
  actions:
    - theme: brand
      text: 🚀 Get Started
      link: /guide/getting-started
    - theme: alt
      text: 📖 API Reference
      link: /api/context
    - theme: alt
      text: 🛠️ Built-in Middlewares
      link: /guide/middlewares
    - theme: alt
      text: 🧪 Postman & Swagger
      link: /guide/postman-swagger

features:
  - icon: ⚡
    title: Extreme C++ Performance
    details: ~450,000 req/s pure C++ engine and 181,000 req/s Node.js facade with epoll/kqueue & multi-threaded SO_REUSEPORT.
  - icon: 🛡️
    title: 20+ Production Middlewares
    details: Built-in Helmet, Rate Limit, Slow Down, CSRF, JWT, Encrypted Cookies, Response Compression & Security Headers.
  - icon: 📜
    title: Postman & Swagger Interactive UI
    details: Self-hosted Postman API Documentation Playground and OpenAPI 3.0 interactive spec generator built-in out of the box.
  - icon: 🚀
    title: Zero-Dependency & Monomorphic
    details: Pure C++17 addon + Node.js native libraries. Zero GC shape churn with strict V8 monomorphic Context pools.
  - icon: 📦
    title: Prebuilt Binary Matrix
    details: Instant setup with precompiled native binaries for Linux (x64), macOS (arm64/Apple Silicon), and Windows (x64).
  - icon: ⚡
    title: C++ Fast-Path Engine
    details: Bypasses JS layer for ultra-low latency static responses delivering 120,000+ req/s zero-allocation routing.
---

## ⚡ Benchmarks Comparison (req/s)

```text
Velociradix (fastGet): ██████████████████████████ 121,235 req/s (0.8ms)
Fastify              : ███████████ 50,301 req/s (2.1ms)
node:http            : ██████████ 47,202 req/s (2.3ms)
Express              : ██ 10,603 req/s (9.4ms)
```

::: tip 💡 Modern Enterprise Stack
Velociradix is engineered for high-concurrency microservices, real-time SSE streaming, zero-dependency JWT authentication, and native OpenAPI/Postman documentation hosting.
:::

