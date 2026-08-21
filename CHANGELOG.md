# Changelog

All notable changes to **Velociradix** are documented in this file based on the Git commit history.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v8.1.0] - 2026-08-21

### Security
- HTTP parser rejects request smuggling: conflicting `Content-Length`, `Transfer-Encoding` + `Content-Length`, obs-fold headers, LF-only framing, missing `Host` on HTTP/1.1, `TRACE`/`CONNECT`.
- Header block cap (32 KiB / 100 headers), URI cap (8 KiB), Slowloris idle timeout (10s), max 16384 connections per worker.
- Response header CR/LF/NUL stripping (C++ and JS) to block header injection.
- Static file serving uses prefix-safe canonical path checks; no fallback to uncanonicalized paths.
- JWT `jwtVerify()` uses `timingSafeEqual`, enforces `nbf`/`iss`/`aud`, rejects empty secrets and oversized tokens.
- AES-256-GCM decrypt validates IV (12) and auth tag (16) lengths.
- `helmet()` ships COOP/CORP/CSP/Permissions-Policy; `X-XSS-Protection` set to `0`.
- CORS never pairs `credentials` with `origin: *`; query/cookie parsers are prototype-pollution safe.
- CSRF uses constant-time compare + Origin check; session cookies default to `HttpOnly` + `SameSite=Lax`.
- `sendFile()` range requests are bounds-checked (416) and read by offset; `serveStatic()` path check uses `path.isAbsolute`.
- Multipart uploads cap files/fields/size and write only basename-sanitized names under `uploadDir`.

### Performance
- `TCP_NODELAY` (and Linux `accept4` + `TCP_QUICKACK`) on accepted sockets.
- Content-Length parsed without heap allocation; header names already lowercased skip extra copies on the write path.
- Range `sendFile()` reads only the requested byte window.

---

## [v8.0.0] - 2026-08-18

> **BREAKING CHANGE:** `encryptValue()`/`decryptValue()` upgraded from AES-256-CBC to AES-256-GCM (authenticated encryption). Existing CBC-encrypted values will not decrypt with GCM. Re-encrypt any stored values after upgrading.

### Security
- AES-256-CBC → AES-256-GCM authenticated encryption (IV + authTag + ciphertext).
- JWT `jwtVerify()` blocks `alg: none` bypass; supports HS256/HS384/HS512.
- `setCookie()` URL-encodes cookie name & value.
- CSRF `_csrf` cookie uses `secure: true`.
- `sendFile()` path traversal protection via `root` option.
- `cookieParse()` handles combined Set-Cookie headers from fetch (`, ` separator).
- Postman/Swagger HTML template escapes `</script` and `<!--` (XSS).
- C++ engine adds `SO_REUSEPORT` on Linux; expanded status phrases.

### Fixed
- `sseInterval()` was silently broken — `native.respond()` could only fire once due to atomic `responded.exchange(true)`. Rewired to use `native.sseBegin()`.
- `compress()` Context method was a no-op; now performs actual gzip/deflate.
- `compress` middleware hooks `ctx.send` **before** `next()` (was after, making it ineffective).
- `jwtSign()` always used SHA-256 regardless of `alg` option; now maps HS384→sha384, HS512→sha512.
- `express.mjs` used bare `require()` in ESM context; replaced with top-level imports.
- Express bridge `sendFile()`/`json()` no longer prematurely set `finished`/`headersSent`.
- Context pool `releaseContext()` resets all stale fields.

### Added
- 7 new error classes: `MethodNotAllowedError` (405), `ConflictError` (409), `UnprocessableEntityError` (422), `TooManyRequestsError` (429), `BadGatewayError` (502), `ServiceUnavailableError` (503), `GatewayTimeoutError` (504).
- `app.cluster()` alias for `setWorkers()`.
- `app.del()` alias for `delete()`.
- `getMimeType()` expanded with 25+ extensions (svg, gif, woff2, wasm, yaml, etc.).
- `jwtVerify()` on Context accepts `opts` with `algorithms` array.
- `jwtAuth()` middleware passes `algorithms` option through.
- `sendFile({root})` to prevent path traversal when serving user-influenced paths.
- `download()`/`attachment()` use RFC 5987 for non-ASCII filenames.
- `all()` uses single `registerRoute('ALL', ...)` call.
- `autoScale()` interval is `unref()`'d.
- C++ chunked encoding errors now trigger proper 400 response.

### TypeScript
- `Request` interface — removed non-existent properties (`originalUrl`, `rawHeaders`, `ip`, `ips`, `requestId`, `secure`, `xhr`, `httpVersion`, `socket`, `connection`).
- Removed non-functional `ws()` from App interface.
- Added `root` to `SendFileOptions`.
- `decorators.d.ts` import path fixed (`./index.js` → `./index.mjs`).
- `jwtVerify` types accept `opts` parameter.
- Expanded `RouteOptions` (`responses`, `response`, `responseCode`, `responseName`, `internal`).

### Build
- `scripts/install.mjs`: Fixed Windows `cl.exe` detection; replaced `process.exit()` with `throw`/`process.exitCode = 1`.
- C++ native addon rebuilt with all changes.

---

## [v7.6.1] - 2026-08-15
### Changed
- Minimalist transparent SVG vector logo (`logo.svg`).
- Cleaned up documentation and README to focus strictly on code, architecture, and benchmark tables.

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
