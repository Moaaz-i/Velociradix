# Changelog

All notable changes to **Velociradix** are documented in this file based on the Git commit history.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v7.6.0] - 2026-08-15
### Added
- Premium High-Tech Documentation Theme with neon gradients and glassmorphism.
- Official brand emblem logo (`logo.png`) and cinematic 16:9 hero banner (`banner.png`).
- Live animated interactive terminal SVG demo (`terminal_demo.svg`).
- Real-World Code Editor & 0.1ms Browser Testing visual showcases.
- Visual comparative throughput benchmark graphs.

## [v7.5.4] - 2026-08-15
### Changed
- Added version notices and installation warnings to use `velociradix@latest` across documentation and README.
- Clarified subpath requirements for `velociradix/client`, `velociradix/express`, and `velociradix/decorators`.

## [v7.5.3] - 2026-08-14
### Added
- In-Memory Request Simulation (`app.inject`) for zero-overhead unit testing without TCP sockets.
- Zero-dependency Streaming Multipart Form-Data & File Uploads (`ctx.formData`, `ctx.file`).
- Advanced Content Negotiation (`ctx.format`) based on `Accept` header.
- File Download & Attachment helpers (`ctx.download`, `ctx.attachment`).
- API Versioning (`app.version`) and Subdomain Routing (`app.subdomain`).

## [v7.5.2] - 2026-08-14
### Added
- Flexible configuration object support in `createClient({ baseURL, token })`.
- Direct body payloads on client `.post()`, `.put()`, and `.patch()`.

## [v7.5.1] - 2026-08-14
### Documentation
- Published comprehensive guide pages for Schema Validation, RPC Client SDK, EventBus, and OOP Decorators.

## [v7.5.0] - 2026-08-14
### Added
- Type-Safe RPC Client SDK (`velociradix/client`) with path chaining and auto-serialization.
- Microservices & EventBus Engine (`createEventBus`, `app.onEvent`, `app.emitEvent`, `app.requestEvent`).
- OOP & Decorators Architecture (`velociradix/decorators`) with IoC Dependency Injection container.
- Universal Schema Validation supporting Zod, TypeBox, Valibot, and built-in rules with OpenAPI 3.0 sync.

## [v7.4.0 - v7.4.1] - 2026-08-14
### Added
- 1:1 Complete Express 4 & Express 5 API Compatibility (`velociradix/express`).
- Route Chaining (`app.route()`, `router.route()`).
- 36+ Built-in Middlewares and interactive Swagger UI / Postman Documentation Playground.

## [v7.3.0] - 2026-08-14
### Added
- Next.js-style File-Based Routing (`app.autoRoute`, `app.autoRouteAsync`) with `[id]` dynamic parameters and `[...slug]` wildcards.

## [v7.2.0] - 2026-08-14
### Added
- V8 Monomorphic Shape Optimization eliminating GC freezes.
- Scoped Route Groups (`app.group`) with isolated middleware chains.
- C++ Fast-Path Responses (`app.fastGet`, `app.fastPost`, `app.fastRoute`) delivering 350,000+ req/s.

## [v7.0.0 - v7.1.0] - 2026-08-13
### Added
- 200+ Enterprise TypeScript Interfaces and strict zero-any typing.
- Synchronous Port Binding Protection and Morgan stream compatibility.

## [v6.0.0 - v6.3.2] - 2026-08-06 to 2026-08-12
### Added
- Native C++17 Core Engine with `SO_REUSEPORT` worker thread clustering.
- Automated multi-platform prebuilds for `linux-x64`, `darwin-arm64`, and `win32-x64`.
- CLI Project Generator (`npx create-velociradix-app`).
