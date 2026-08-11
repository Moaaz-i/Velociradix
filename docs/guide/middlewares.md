# Built-in Middlewares Guide

Velociradix comes with over 20 built-in, zero-dependency, highly optimized middlewares.

---

## 🚀 Complete Middlewares Reference

### 1. `logger(options)`
Logs incoming HTTP requests with response status and execution time.
- `logger`: Custom logging function (default: `console.log`)
- `includeRes`: Log detailed response status (default: `false`)

### 2. `helmet(options)`
Injects essential HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`).
- `frameOptions`: Header value (default: `'SAMEORIGIN'`)
- `referrerPolicy`: Referrer policy (default: `'no-referrer'`)

### 3. `cors(options)`
Configures Cross-Origin Resource Sharing and handles `OPTIONS` preflight.
- `origin`: Allowed origins (default: `'*'`)
- `methods`: Allowed HTTP methods (default: `'GET,POST,PUT,DELETE,PATCH,OPTIONS'`)
- `headers`: Allowed headers
- `credentials`: Allow cookies / auth headers (`true` | `false`)

### 4. `rateLimit(options)`
IP-based sliding-window rate limiter.
- `windowMs`: Time window in ms (default: `60000`)
- `max`: Max requests per IP within window (default: `100`)
- `message`: Custom error response message

### 5. `slowDown(options)`
Progressive request delay limiter to prevent brute-force attacks.
- `delayAfter`: Request count threshold before adding delay (default: `5`)
- `delayMs`: Delay in ms added per request (default: `500`)
- `windowMs`: Time window (default: `60000`)

### 6. `cache(options)`
In-memory high-speed response cache with TTL and LRU eviction.
- `ttlMs`: Cache duration in ms (default: `10000`)
- `maxSize`: Max entries in cache store (default: `1000`)

### 7. `sanitize()`
Sanitizes incoming URL query parameters and route parameters against XSS injection attacks.

### 8. `jwtAuth(options)`
HMAC-SHA256 JWT Token verification middleware.
- `secret`: Secret key used for signature verification. Attaches decoded payload to `ctx.state.user`.

### 9. `bearerAuth(options)`
Static bearer token guard.
- `token`: Expected static token string.
- `verify`: Custom function `(token, ctx) => boolean`.

### 10. `session(options)`
AES-256-CBC cookie-backed encrypted user session store.
- `secret`: Secret key for payload encryption.
- `name`: Session cookie name (default: `'_session'`).

### 11. `basicAuth(options)`
HTTP Basic Authentication guard.
- `users`: Object containing valid username-password pairs `{ admin: 'secret123' }`.

### 12. `ipFilter(options)`
Allows or blocks incoming requests based on IP address ranges.
- `allow`: Array of whitelisted IPs.
- `block`: Array of blacklisted IPs.

### 13. `sizeLimit(options)`
Rejects incoming request payloads exceeding maximum byte threshold.
- `maxBytes`: Payload limit in bytes (e.g. `1024 * 1024` for 1MB).

### 14. `timeout(options)`
Aborts requests taking longer than specified timeout duration.
- `ms`: Maximum allowed execution duration in ms (default: `5000`).

### 15. `apiKey(options)`
Validates API keys from request headers or query strings.
- `key`: Required static key or array of keys.
- `headerName`: Custom header name (default: `'X-API-Key'`).

### 16. `responseTime()`
Injects high-resolution `X-Response-Time` header to all outgoing responses.

### 17. `requestId(options)`
Generates or forwards unique request correlation IDs for tracing.
- `headerName`: Custom header name (default: `'X-Request-ID'`).

### 18. `etag()`
Automatic ETag header generator (`Weak` & `Strong` ETag support) for HTTP caching.

### 19. `csp(options)`
Generates customizable `Content-Security-Policy` headers.

### 20. `compress(options)`
Gzip/Deflate response body compression handler for payloads exceeding threshold size.

---

## 🛠️ Usage Example

```js
import velociradix, { logger, helmet, rateLimit, cors } from 'velociradix';

const app = velociradix();

app.use(logger());
app.use(helmet());
app.use(cors({ origin: 'https://example.com' }));
app.use(rateLimit({ max: 100, windowMs: 60000 }));

app.get('/api/health', (ctx) => ctx.json({ status: 'ok' }));

app.listen(3000);
```

