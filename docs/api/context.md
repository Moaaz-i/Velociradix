# Context (`ctx`) API Reference

The `Context` (`ctx`) object encapsulates both the incoming HTTP Request and the outgoing HTTP Response into a single unified, ultra-fast interface.

---

## 📥 Request Properties & Methods

| Property / Method | Type / Signature | Description |
| :--- | :--- | :--- |
| `ctx.req` | `Request` | Raw incoming HTTP request object. |
| `ctx.res` | `Response` | Raw outgoing HTTP response object. |
| `ctx.method` | `string` | Uppercased HTTP method (`'GET'`, `'POST'`, `'PUT'`, `'DELETE'`, etc.). |
| `ctx.url` | `string` | Complete raw request URL string (including query parameters). |
| `ctx.path` | `string` | Normalized request path (excluding query parameters). |
| `ctx.ip` | `string` | Resolved client IP address. Supports `X-Forwarded-For` header resolution. |
| `ctx.ips` | `string[]` | Array of proxy IP addresses extracted from `X-Forwarded-For`. |
| `ctx.headers` | `Record<string, string>` | Key-value map of lowercased request headers. |
| `ctx.params` | `Record<string, string>` | Object containing dynamic route path parameters (e.g., `:id`, `:category`). |
| `ctx.state` | `Record<string, any>` | User-land state storage passed between middlewares and route handlers. |

### `ctx.get(headerName)`
Returns the case-insensitive request header value.
```js
const userAgent = ctx.get('user-agent');
const authHeader = ctx.get('Authorization');
```

### `ctx.query(key?)`
Parses and returns URL query parameters. If no key is passed, returns the full query object.
```js
// GET /search?q=velociradix&limit=10
const search = ctx.query('q'); // 'velociradix'
const allQuery = ctx.query(); // { q: 'velociradix', limit: '10' }
```

### `ctx.cookie(name)`
Parses and returns a specific request cookie value by name.
```js
const sessionId = ctx.cookie('session_id');
```

### `ctx.body()` / `ctx.req.body`
`ctx.req.body` returns the raw body string. Calling `await ctx.body()` parses and returns the JSON payload as an Object (or `{}` if unparseable).
```js
const rawText = ctx.req.body;
const payload = await ctx.body(); // Automatically parses JSON body
```

### `ctx.bearerToken()`
Extracts the Bearer token string from the `Authorization: Bearer <token>` header.
```js
const token = ctx.bearerToken(); // 'eyJhbGciOiJIUzI1Ni...'
```

### `ctx.basicAuth()`
Extracts HTTP Basic Authentication credentials.
```js
const auth = ctx.basicAuth(); // { username: 'admin', password: 'secret123' }
```

---

## 📤 Response Methods

All response methods support method chaining.

### `ctx.status(code)`
Sets the HTTP status code (default: `200`).
```js
ctx.status(201).json({ created: true });
```

### `ctx.setHeader(key, value)`
Sets a single HTTP response header.
```js
ctx.setHeader('X-Powered-By', 'Velociradix');
```

### `ctx.setCookie(name, value, options)`
Sets a response cookie with modern security options.
```js
ctx.setCookie('session_id', 'abc123xyz', {
  httpOnly: true,
  secure: true,
  maxAge: 3600, // 1 hour in seconds
  sameSite: 'Lax',
  path: '/'
});
```

### `ctx.setEncryptedCookie(name, value, secret, options)`
Encrypts a cookie value using AES-256-CBC before setting the header.
```js
ctx.setEncryptedCookie('user_secret', { userId: 42 }, 'super-secret-key-32-chars!!', {
  httpOnly: true,
  maxAge: 86400
});
```

### `ctx.getEncryptedCookie(name, secret)`
Decrypts and parses an encrypted cookie payload.
```js
const data = ctx.getEncryptedCookie('user_secret', 'super-secret-key-32-chars!!');
console.log(data.userId); // 42
```

### `ctx.json(object, status?)`
Sends a JSON response with `Content-Type: application/json`.
```js
return ctx.json({ status: 'ok', data: [1, 2, 3] }, 200);
```

### `ctx.html(htmlString, status?)`
Sends an HTML document response with `Content-Type: text/html; charset=utf-8`.
```js
return ctx.html('<h1>Welcome to Velociradix</h1>');
```

### `ctx.send(data, status?)`
Sends a plain text, Buffer, or string response.
```js
return ctx.send('Hello World', 200);
```

### `ctx.redirect(url, code?)`
Redirects the client to another URL (default status: `302`).
```js
return ctx.redirect('/dashboard', 302);
```

### `ctx.sendFile(filepath, options?)`
Serves static files with automatic ETag generation, 304 Not Modified caching, and HTTP Range Requests (206 Partial Content) support.
```js
return ctx.sendFile('./public/image.png');
```

### `ctx.time(label)` / `ctx.timeEnd(label)`
Measures execution time and injects W3C `Server-Timing` headers into the response.
```js
ctx.time('db-query');
const users = await db.query('SELECT * FROM users');
ctx.timeEnd('db-query'); // Injects Server-Timing: db-query;dur=1.45
```

---

## ⚡ Server-Sent Events (SSE)

### `ctx.sse(callback)`
Initiates a Server-Sent Events HTTP stream (`Content-Type: text/event-stream`).

```js
ctx.sse((sendEvent, close) => {
  sendEvent({ time: Date.now() }, 'ping');

  const timer = setInterval(() => {
    sendEvent({ message: 'heartbeat' });
  }, 1000);

  // Close stream after 10 seconds
  setTimeout(() => {
    clearInterval(timer);
    close();
  }, 10000);
});
```

