# Features Overview

Velociradix is built from the ground up for extreme throughput, zero runtime dependency overhead, and enterprise readiness.

---

## ⚡ Core Engine Highlights

- **Event-Driven Architecture**: Powered by OS-native multiplexers (`kqueue` on macOS/BSD, `epoll` on Linux).
- **SO_REUSEPORT Multi-Threading**: Spawns multiple worker threads listening on the same port, achieving load balancing across CPU cores.
- **Zero-Copy Parsing**: HTTP headers and paths are parsed using minimal allocations.
- **Radix Trie Routing**: $O(K)$ parameter and wildcard route resolution written in pure C++17.
- **Prebuilt Binaries**: Cross-platform precompiled modules (`linux-x64`, `darwin-arm64`, `win32-x64`) for instant installation.

---

## 🛡️ Enterprise Middleware Suite

Velociradix includes **over 20 built-in production-grade middlewares**:

1. `logger()`: Tracks requests with color status, response duration, and uncaught error status codes.
2. `helmet()`: Sets modern security headers (`X-Frame-Options`, `HSTS`, `CSP`, `Referrer-Policy`).
3. `cors()`: Handles CORS preflight (`OPTIONS`) and cross-origin headers.
4. `rateLimit()`: IP-based sliding window rate limiter with auto GC.
5. `slowDown()`: Progressive response delay for repeated requests.
6. `cache()`: High-performance in-memory response cache with TTL & LRU eviction.
7. `validate()`: Native Zod and custom schema validator for body, params, query, and headers.
8. `sanitize()`: XSS input sanitizer for URL query strings and route path params.
9. `jwtAuth()` & `bearerAuth()`: Bearer token and JWT verification.
10. `session()`: AES-256-CBC cookie-backed encrypted user session store.
11. `ipFilter()`: IP whitelist and blacklist guard.
12. `responseTime()`: Injects `X-Response-Time` high-resolution timer header.
13. `sizeLimit()`: Blocks oversized request payloads.
14. `maintenance()`: Returns `HTTP 530` / `503` during scheduled server maintenance.
15. `basicAuth()`: HTTP Basic Authentication guard.
16. `csp()`: Content-Security-Policy header generator.
17. `timeout()`: Enforces gateway timeout per route.
18. `apiKey()`: API key verification from header or query string.
19. `concurrencyLimit()`: Dynamic request throttler for busy servers.
20. `etag()`: Automatic weak & strong ETag generator.
