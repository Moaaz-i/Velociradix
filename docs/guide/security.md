# JWT, Crypto & HTTP Security

Velociradix ships zero-dependency JWT and AES-256-GCM helpers. The C++ engine rejects HTTP request smuggling, oversize headers, `TRACE`/`CONNECT`, and Slowloris-style incomplete requests — independently of any JavaScript middleware.

Secrets for `jwtAuth` and `session` must come from the environment (`process.env.JWT_SECRET`), never from source.

---

## 1. Zero-Dependency JWT (`jwtSign` / `jwtVerify`)

Verification is constant-time (`crypto.timingSafeEqual`), blocks `alg: none`, and honors `exp`, `nbf`, `iss`, and `aud`.

```js
import { createApp, jwtSign, jwtAuth } from "velociradix";

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET;

app.post("/login", (ctx) => {
  const token = ctx.jwtSign({ userId: 42, role: "admin" }, JWT_SECRET, {
    expiresIn: 3600,
    issuer: "velociradix",
  });
  return { token };
});

app.get(
  "/dashboard",
  (ctx) => {
    return { welcome: ctx.state.user };
  },
  {
    middlewares: [jwtAuth({ secret: JWT_SECRET, issuer: "velociradix" })],
  },
);
```

---

## 2. AES-256-GCM Encrypted Cookies & Sessions

IV is 12 bytes and the auth tag is 16 bytes. Malformed ciphertext returns `undefined` without leaking error details.

```js
app.get("/login-session", (ctx) => {
  ctx.setEncryptedCookie(
    "user_session",
    { userId: 101, token: "abc" },
    process.env.COOKIE_SECRET,
  );
  return { status: "logged_in" };
});

app.get("/profile", (ctx) => {
  const session = ctx.getEncryptedCookie(
    "user_session",
    process.env.COOKIE_SECRET,
  );
  return { session };
});
```

`setCookie()` defaults to `Path=/` and `SameSite=Lax`. Session cookies also set `HttpOnly`.

---

## 3. HTTP Parser Guarantees (C++ engine)

Applied to every connection before JavaScript runs:

| Check                                        | Result   |
| :------------------------------------------- | :------- |
| HTTP/1.1 without `Host`                      | `400`    |
| Conflicting `Content-Length`                 | `400`    |
| `Transfer-Encoding` + `Content-Length`       | `400`    |
| Header folding (obs-fold) / LF-only framing  | `400`    |
| `TRACE` / `CONNECT`                          | `405`    |
| Header block > 32 KiB or > 100 headers       | `431`    |
| URI > 8 KiB                                  | `414`    |
| Incomplete headers idle > 10s                | `408`    |
| CR/LF/NUL in response header names or values | stripped |

`ctx.ip` uses the TCP peer from `accept()` unless `app.setTrustProxy(true)` is set.

---

## 4. `helmet()` and `cors()`

```js
app.use(helmet());
app.use(cors({ origin: "https://example.com", credentials: true }));
```

`helmet()` sends CSP, COOP, CORP, HSTS, `X-Content-Type-Options`, and `Permissions-Policy`. `X-XSS-Protection` is `0` (the legacy XSS auditor is harmful).

For a public API consumed from other origins:

```js
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: "cross-origin",
  }),
);
```

`cors({ credentials: true })` never pairs with `Access-Control-Allow-Origin: *` — the request `Origin` is reflected instead.

---

## 5. CSRF

Double-submit cookie plus constant-time header compare and `Origin` host match. Send `X-CSRF-Token` (tokens are not accepted from the query string).

```js
app.use(csrf());
```
