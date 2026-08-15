# 📜 Changelog & Version History

All notable architectural milestones, feature additions, and versions of **Velociradix** are documented here directly from the Git commit log.

> [!TIP]
> Always install the latest stable version: `npm install velociradix@latest`

---

## [v7.6.0] - 2026-08-15 🎨 MAJOR VISUAL & BRANDING RELEASE
### 🌟 Visual Identity, Modern Theme & Interactive Showcases
- **Premium High-Tech Theme**: Rebuilt VitePress documentation with glowing Cyberpunk neon accents, glassmorphism card surfaces, and gradient typography.
- **Official Brand Identity**: Introduced official high-tech emblem logo (`logo.png`) and cinematic 16:9 hero banner (`banner.png`).
- **Live Animated Terminal Demo**: Added interactive vector terminal animation (`terminal_demo.svg`) demonstrating real-time C++ engine startup, route compilation, and client RPC execution.
- **Real-World Code & Browser Showcases**: Added visual showcases for real TypeScript code with Zod validation and sub-millisecond (0.1ms) Swagger UI / Postman playground testing.
- **Visual Throughput Benchmark Bars**: Added comparative visual benchmark graphs against Fastify, native `node:http`, and Express.

---
## [v7.5.4] - 2026-08-15
### 📝 Documentation & Release Guard
- **Upgrade Notice**: Added prominent alerts across documentation and `README.md` to ensure developers install `velociradix@latest`.
- **Subpath Clarification**: Detailed the subpath requirements (`velociradix/client`, `velociradix/express`, `velociradix/decorators`) for users upgrading from legacy `v6.x`.

---

## [v7.5.3] - 2026-08-14
### 🚀 In-Memory Testing, Multipart & Content Negotiation
- **In-Memory Testing (`app.inject`)**: High-performance HTTP request simulation engine capable of running route handlers, middlewares, and schemas directly in memory without opening TCP network sockets.
- **Streaming Multipart Parser (`ctx.formData`, `ctx.file`)**: Pure Node.js zero-dependency multipart parser capable of handling file uploads and form fields with disk streaming.
- **Content Negotiation (`ctx.format`)**: Native content negotiation matching the incoming `Accept` header (JSON, HTML, plain text).
- **File Downloads (`ctx.download`, `ctx.attachment`)**: Automated file download responses with `Content-Disposition` attachment headers and ETag validation.
- **API Versioning & Subdomains (`app.version`, `app.subdomain`)**: Added route-scoped versioning and subdomain routing helpers.

---

## [v7.5.2] - 2026-08-14
### ⚡ Client SDK Enhancements
- **Flexible Initialization**: Supported passing configuration options as a direct object (`createClient({ baseURL, token })`).
- **Direct Body Payloads**: Enabled direct object payloads on `.post()`, `.put()`, and `.patch()`.

---

## [v7.5.1] - 2026-08-14
### 📚 Advanced Architecture Documentation
- Published comprehensive guide pages for Schema Validation, RPC Client SDK, EventBus, and OOP Decorators.

---

## [v7.5.0] - 2026-08-14 💎 MAJOR FEATURE RELEASE
### 🌟 Next-Gen Architecture & SDK Expansion
- **Type-Safe RPC Client SDK (`velociradix/client`)**: Zero-boilerplate proxy client with deep path chaining (`api.users['123'].get()`), auto JSON serialization, query parameter formatting, and token authentication.
- **Microservices & EventBus Engine (`createEventBus`)**: High-throughput event bus with wildcard subscriptions (`user.*`, `order.**`), async broadcasting, and Request-Reply RPC (`app.requestEvent()`).
- **OOP & Decorators Architecture (`velociradix/decorators`)**: Class-based controller decorators (`@Controller`, `@Get`, `@Post`, `@Body`, `@Param`, `@Query`, `@Use`, `@Injectable`, `@Inject`) with IoC dependency injection container.
- **Universal Schema Validation & Type Safety**: Native declarative route schemas supporting Zod, TypeBox, Valibot, and built-in rules with `ctx.validBody`, `ctx.validQuery`, and automatic OpenAPI 3.0 / Swagger UI parameter synchronization.

---

## [v7.4.0 - v7.4.1] - 2026-08-14
### 🔄 1:1 Complete Express Compatibility
- **Express Drop-in Bridge (`velociradix/express`)**: Complete Express 4 and Express 5 drop-in replacement with named exports (`Router`, `json`, `urlencoded`, `static`, `raw`, `text`).
- **Route Chaining**: Added `app.route('/path').get(...).post(...)` and `router.route(...)`.
- **36+ Built-in Middlewares**: Rate limiting, Helmet, CSRF, JWT, In-Memory TTL Cache, ETag, Cryptography, Slow Down, Response Time, Size Limit, and CORS.
- **Self-Hosted Documentation**: Integrated interactive Swagger UI (`/docs`) and Postman Playground (`/postman-docs`).

---

## [v7.3.0] - 2026-08-14
### 📁 File-Based Routing
- **Automatic File Routing (`app.autoRoute`, `app.autoRouteAsync`)**: Next.js-style file-based routing with dynamic parameter mapping (`[id].ts` ➔ `:id`) and catch-all wildcards (`[...slug].ts` ➔ `*`).
- **HTTP Method Named Exports**: Supported named function exports (`export function GET()`, `POST()`) in file routes.

---

## [v7.2.0] - 2026-08-14
### 🏎️ V8 Performance & Scoped Groups
- **V8 Monomorphic Shape Optimization**: Strict object shape enforcement in JS `Context` and `Request` pools eliminating GC shape churn.
- **Scoped Route Groups (`app.group`)**: Sub-router grouping with isolated middleware pipelines.
- **C++ Fast-Path Responses (`app.fastGet`, `app.fastPost`, `app.fastRoute`)**: Responses served directly from native C++ memory delivering 350,000+ req/s.

---

## [v7.0.0 - v7.1.0] - 2026-08-13
### 🏗️ Enterprise Overhaul
- **200+ Enterprise TypeScript Interfaces**: Strict zero-any typing across all modules.
- **Synchronous Port Binding Protection**: Native error catching on port conflicts.
- **Morgan & Stream Compatibility**: Full support for standard Node.js logging and stream pipelines.

---

## [v6.0.0 - v6.3.2] - 2026-08-06 to 2026-08-12
### 🧵 Multi-Threading & Native Core
- **Native C++17 Core Engine**: Event-driven `kqueue`/`epoll` native architecture.
- **Multi-threaded Worker Threads**: `SO_REUSEPORT` worker thread clustering delivering 180,000+ req/s.
- **Prebuilt Binary Matrix**: Automated GitHub Actions precompilation for `linux-x64`, `darwin-arm64`, and `win32-x64`.
- **CLI Project Generator**: Added `npx create-velociradix-app` for rapid scaffolding.
- **Zero Runtime Dependencies**: Pure C++17 addon + Node.js native libraries.
