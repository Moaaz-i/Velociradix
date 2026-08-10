---
layout: home

hero:
  name: "Velociradix"
  text: "Ultra-Fast C++17 HTTP Engine & Node.js Framework"
  tagline: Zero-dependency, event-driven (kqueue/epoll), multi-threaded C++ engine serving 180,000+ req/s
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/context
    - theme: alt
      text: View on GitHub
      link: https://github.com/Moaaz-i/Velociradix

features:
  - icon: ⚡
    title: Extreme C++ Performance
    details: ~450,000 req/s pure C++ engine and 181,000 req/s Node.js facade with epoll/kqueue & multi-threaded SO_REUSEPORT.
  - icon: 🛡️
    title: 60+ Enterprise Features
    details: Built-in Helmet, Rate Limit, Slow Down, CSRF, JWT, Encrypted Cookies, Response Compression & 20+ Production Middlewares.
  - icon: 🚀
    title: Zero-Dependency & Monomorphic
    details: Pure C++17 addon + Node.js native libraries. Zero GC shape churn with strict V8 monomorphic Context pools.
---

## ⚡ Quick Benchmark Comparison

```
Velociradix (fastGet): ██████████████████████████ 121,235 req/s
Fastify              : ███████████ 50,301 req/s
node:http            : ██████████ 47,202 req/s
Express              : ██ 10,603 req/s
```
