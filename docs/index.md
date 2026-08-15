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
    title: 36+ Built-in Middlewares & Express Bridge
    details: Built-in 1:1 Express 4/5 compatibility, Helmet, Rate Limit, CSRF, JWT, Cookies & Security Headers.
  - icon: 🚀
    title: Type-Safe RPC Client & SDK
    details: Zero-boilerplate proxy client (velociradix/client) with path chaining, query string formatting & token auth.
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

