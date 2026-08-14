# Built-in Middlewares Reference

Velociradix comes with **36+ built-in, zero-dependency, ultra-fast middlewares** ready to import and use.

```javascript
import {
  app,
  logger,
  cors,
  helmet,
  rateLimit,
  jwtAuth,
  session,
  cache,
  validate,
  requestId,
  circuitBreaker,
  etag,
  compress,
} from 'velociradix';
```

---

## 🚀 Complete Middlewares Reference (All 36 Middlewares)

### 1. `logger(options?)`
Logs incoming requests with HTTP method, URL path, status code, and response time.
- `logger`: Custom logger function `(msg) => void` (default: `console.log`)
- `includeRes`: Log response status and duration (default: `false`)

```javascript
app.use(logger({ includeRes: true }));
```

---

### 2. `helmet(options?)`
Injects essential HTTP security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`, `HSTS`).
- `frameOptions`: Frame options header value (default: `'SAMEORIGIN'`)
- `referrerPolicy`: Referrer policy (default: `'no-referrer'`)

```javascript
app.use(helmet());
```

---

### 3. `cors(options?)`
Configures Cross-Origin Resource Sharing and handles `OPTIONS` preflight requests automatically.
- `origin`: Allowed origin string or array (default: `'*'`)
- `methods`: Allowed HTTP methods (default: `'GET,POST,PUT,DELETE,PATCH,OPTIONS'`)
- `headers`: Allowed header names
- `credentials`: Support cookies & authorization headers (`true` | `false`)

```javascript
app.use(cors({ origin: 'https://example.com', credentials: true }));
```

---

### 4. `rateLimit(options?)`
Sliding-window IP rate limiter to protect against spam and denial-of-service.
- `windowMs`: Time window in milliseconds (default: `60000`)
- `max`: Maximum requests allowed per IP in the window (default: `100`)
- `message`: Custom error payload on limit exceeded

```javascript
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));
```

---

### 5. `rateLimitByKey(keyFn, options?)`
Rate limit requests partitioned by custom keys (e.g. User ID, API Key, Tenant).

```javascript
app.use(rateLimitByKey((ctx) => ctx.get('X-API-Key') || ctx.ip, { max: 50 }));
```

---

### 6. `slowDown(options?)`
Progressive request delay limiter that gradually slows down abusive clients instead of immediately blocking them.
- `delayAfter`: Request count threshold before adding delay (default: `5`)
- `delayMs`: Delay in ms added per request (default: `500`)
- `windowMs`: Time window (default: `60000`)

```javascript
app.use(slowDown({ delayAfter: 10, delayMs: 200 }));
```

---

### 7. `jwtAuth(options)`
HMAC-SHA256 JWT Token verification middleware. Parses `Authorization: Bearer <token>`, verifies signature & expiration, and attaches the payload to `ctx.state.user`.
- `secret`: Secret key used for signature verification (Required).

```javascript
app.use('/admin/*', jwtAuth({ secret: 'my-super-secret-key' }));
```

---

### 8. `bearerAuth(options)`
Static or custom-verified bearer token guard.
- `token`: Expected static token string.
- `verify`: Custom callback `(token, ctx) => boolean`.

```javascript
app.use(bearerAuth({ token: 'secret-token-12345' }));
```

---

### 9. `basicAuth(options)`
HTTP Basic Authentication guard.
- `users`: Object map of valid username-password credentials `{ admin: 'password' }`.
- `realm`: Custom authentication realm string.

```javascript
app.use(basicAuth({ users: { admin: 'supersecret' } }));
```

---

### 10. `apiKey(options)`
Validates API keys from request headers or query strings.
- `key`: Required API key or array of valid keys.
- `headerName`: Header name to read (default: `'X-API-Key'`).

```javascript
app.use(apiKey({ key: ['secret-key-1', 'secret-key-2'] }));
```

---

### 11. `cache(options?)`
In-memory high-speed response cache with TTL and LRU eviction.
- `ttlMs`: Cache duration in milliseconds (default: `10000`)
- `maxSize`: Maximum entries in cache store (default: `1000`)

```javascript
app.use('/public-api/*', cache({ ttlMs: 30000 }));
```

---

### 12. `session(options)`
AES-256-CBC encrypted, cookie-backed user session store.
- `secret`: Encryption secret key.
- `name`: Session cookie name (default: `'_session'`).

```javascript
app.use(session({ secret: 'secure-session-key-32-chars!!' }));
```

---

### 13. `csrf(options?)`
Cross-Site Request Forgery protection with token generation and header/body validation.
- `secret`: Secret key for token signing.

```javascript
app.use(csrf({ secret: 'csrf-secret-key' }));
```

---

### 14. `validate(schema)`
Schema validation middleware for incoming request bodies, params, and query strings.

```javascript
app.post('/register', validate({
  email: { type: 'email', required: true },
  password: { type: 'string', required: true, min: 8 }
}), (ctx) => {
  return ctx.json({ success: true });
});
```

---

### 15. `sanitize()`
Sanitizes incoming URL query parameters and body values against XSS injection attacks.

```javascript
app.use(sanitize());
```

---

### 16. `bodyCleaner(options?)`
Cleans incoming JSON payloads by stripping unexpected or blacklisted fields.

```javascript
app.use(bodyCleaner({ stripHtml: true, trimStrings: true }));
```

---

### 17. `compress(options?)`
Gzip & Deflate response body compression handler for payloads exceeding threshold size.
- `threshold`: Minimum byte size to compress (default: `1024` bytes).

```javascript
app.use(compress({ threshold: 1024 }));
```

---

### 18. `etag(options?)`
Automatic ETag header generator (`Weak` & `Strong` ETag support) for HTTP caching and `304 Not Modified` responses.

```javascript
app.use(etag());
```

---

### 19. `conditionalRequest()`
Handles `If-None-Match` and `If-Modified-Since` conditional headers and sends `304 Not Modified` when content is unchanged.

```javascript
app.use(conditionalRequest());
```

---

### 20. `requestId(options?)`
Generates or forwards unique request correlation IDs (`X-Request-ID`) for distributed tracing.
- `headerName`: Custom header name (default: `'X-Request-ID'`).

```javascript
app.use(requestId());
```

---

### 21. `responseTime()`
Injects high-resolution `X-Response-Time` header (`X-Response-Time: 1.23ms`) to all outgoing responses.

```javascript
app.use(responseTime());
```

---

### 22. `ipFilter(options)`
Allows or blocks incoming requests based on IP address lists.
- `allow`: Array of whitelisted IP addresses.
- `block`: Array of blacklisted IP addresses.

```javascript
app.use(ipFilter({ block: ['192.168.1.100'] }));
```

---

### 23. `hostGuard(allowedHosts)`
Rejects requests with unexpected `Host` header values to prevent DNS rebinding and host-header attacks.

```javascript
app.use(hostGuard(['api.example.com', 'localhost:3000']));
```

---

### 24. `userAgentBlocker(options)`
Blocks known bots, scrapers, or empty User-Agent strings.

```javascript
app.use(userAgentBlocker({ blockEmpty: true, blockedPatterns: [/curl/i, /wget/i] }));
```

---

### 25. `allowedMethods(methods)`
Enforces allowed HTTP methods for endpoints and returns `405 Method Not Allowed` for unsupported verbs.

```javascript
app.use(allowedMethods(['GET', 'POST', 'OPTIONS']));
```

---

### 26. `methodOverride(options?)`
Allows clients to override HTTP methods using `X-HTTP-Method-Override` header or `_method` query parameter.

```javascript
app.use(methodOverride());
```

---

### 27. `sizeLimit(maxBytes)`
Rejects request payloads exceeding the maximum byte threshold with `413 Payload Too Large`.

```javascript
app.use(sizeLimit(1024 * 1024 * 5)); // 5MB
```

---

### 28. `timeout(ms)`
Aborts requests taking longer than the specified timeout duration with `504 Gateway Timeout`.

```javascript
app.use(timeout(10000)); // 10s
```

---

### 29. `concurrencyLimit(maxConcurrent)`
Limits the number of concurrent requests executing simultaneously to prevent resource exhaustion.

```javascript
app.use(concurrencyLimit(500));
```

---

### 30. `circuitBreaker(options?)`
Circuit breaker pattern that automatically trips open and fails fast when downstream errors spike.
- `failureThreshold`: Failure count threshold before opening circuit.
- `resetTimeoutMs`: Timeout before testing recovery.

```javascript
app.use(circuitBreaker({ failureThreshold: 10, resetTimeoutMs: 15000 }));
```

---

### 31. `csp(directives)`
Generates customizable `Content-Security-Policy` security headers.

```javascript
app.use(csp({ 'default-src': ["'self'"], 'script-src': ["'self'", 'https://cdn.example.com'] }));
```

---

### 32. `headerInjector(headers)`
Injects static headers across all outgoing responses.

```javascript
app.use(headerInjector({ 'X-Powered-By': 'Velociradix-Engine' }));
```

---

### 33. `redirector(redirectsMap)`
Redirects legacy paths or URL patterns to new destinations.

```javascript
app.use(redirector({ '/old-page': '/new-page' }));
```

---

### 34. `auditLog(options?)`
Creates structured JSON audit logs for security, compliance, and auditing.

```javascript
app.use(auditLog({ logFn: (entry) => console.log(JSON.stringify(entry)) }));
```

---

### 35. `favicon(path?)`
Serves the `favicon.ico` icon directly and caches it in memory.

```javascript
app.use(favicon('./public/favicon.ico'));
```

---

### 36. `maintenance(options?)`
Puts the entire application or specific routes into maintenance mode with `503 Service Unavailable`.
- `enabled`: Boolean flag.
- `message`: Custom maintenance message or HTML.

```javascript
app.use(maintenance({ enabled: false, message: 'Under scheduled maintenance. Back soon!' }));
```
