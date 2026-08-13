# Context (`ctx`) API Reference

The `ctx` object encapsulates the incoming HTTP Request (`ctx.req`) and outgoing HTTP Response (`ctx.res`) for each request lifecycle.

> [!TIP]
> The `ctx` object is pooled in memory (V8 Monomorphic Object Pool) to guarantee zero Garbage Collection freezes during high request throughput.

---

## 📥 Request Properties & Operations

### `ctx.req`
Direct reference to the low-level `Request` wrapper object containing parsed request details.

| Property | Type | Description |
| :--- | :--- | :--- |
| `ctx.path` | `string` | URL path portion of request (e.g. `/api/users`). |
| `ctx.method` | `string` | HTTP Method string (`'GET'`, `'POST'`, `'PUT'`, etc.). |
| `ctx.query(key)` | `string` | Returns parsed URL query string parameter value. |
| `ctx.params` | `Record<string, string>` | Key-value object of route path parameters (e.g. `:id`). |
| `ctx.ip` | `string` | Resolved client IP address (supports `setTrustProxy`). |
| `ctx.ips` | `string[]` | Array of proxy IP addresses from `X-Forwarded-For`. |
| `ctx.requestId` | `string` | Unique request correlation ID (`X-Request-ID`). |

---

## 🛡️ Input Validation

### `ctx.validate(rules, targetData?)`
Validates request body, query string, or path parameters against schema rules. Throws a structured `BadRequestError` (400) if validation fails.

| Rule Property | Type | Description |
| :--- | :--- | :--- |
| `required` | `boolean` | Requires field to be present and non-empty. |
| `type` | `'string' \| 'number' \| 'boolean' \| 'email' \| 'array' \| 'object'` | Value data type check. |
| `min` | `number` | Minimum string/array length or numeric value. |
| `max` | `number` | Maximum string/array length or numeric value. |
| `pattern` | `RegExp` | Regex pattern matching rule. |

```javascript
app.post('/api/register', (ctx) => {
  const data = ctx.validate({
    username: { type: 'string', required: true, min: 3 },
    email: { type: 'email', required: true },
    age: { type: 'number', min: 18 }
  });
  return ctx.json({ status: 'ok', data });
});
```

---

## 📤 Response Operations

### `ctx.status(code)`
Sets the HTTP status code for the response.

```javascript
ctx.status(201).json({ created: true });
```

---

### `ctx.json(value)`
Sends a JSON response payload with `Content-Type: application/json`.

```javascript
return ctx.json({ message: 'Hello Velociradix' });
```

---

### `ctx.send(body)`
Sends raw text, Buffer, or object response payload to the client.

```javascript
return ctx.send('Plain text response');
```

---

### `ctx.sendFile(filepath, opts?)`
Serves a static file from disk with ETag calculation, `304 Not Modified`, and `HTTP 206 Partial Content` Byte-Range Request support.

```javascript
return ctx.sendFile('./uploads/report.pdf');
```

---

### `ctx.setCookie(name, value, options?)`
Sets a `Set-Cookie` response header.

```javascript
ctx.setCookie('sid', '123456', { httpOnly: true, secure: true, maxAge: 3600 });
```

---

### `ctx.setEncryptedCookie(name, value, secret, options?)`
Encrypts data using AES-256-CBC and sets an encrypted cookie header.

```javascript
ctx.setEncryptedCookie('user_session', { id: 42 }, 'secret-key-123');
```

---

## 🔑 Authentication & Crypto Helpers

### `ctx.jwtSign(payload, secret, opts?)`
Signs a payload object using HMAC-SHA256 and returns a JWT token string.

```javascript
const token = ctx.jwtSign({ userId: 42, role: 'admin' }, 'secret-key', { expiresIn: 3600 });
```

---

### `ctx.jwtVerify(secret)`
Extracts and verifies Bearer JWT token from `Authorization` header.

```javascript
const user = ctx.jwtVerify('secret-key');
```
