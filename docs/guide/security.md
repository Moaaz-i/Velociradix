# JWT & Crypto Security

Velociradix includes zero-dependency utilities for JWT authentication and AES-256-CBC encryption.

---

## 1. Zero-Dependency JWT (`jwtSign` / `jwtVerify`)

```js
import { createApp, jwtSign, jwtAuth } from 'velociradix';

const app = createApp();
const JWT_SECRET = 'super-secret-key-12345';

// Issue JWT Token
app.post('/login', (ctx) => {
  const token = ctx.jwtSign({ userId: 42, role: 'admin' }, JWT_SECRET, { expiresIn: 3600 });
  return { token };
});

// Protect Route with jwtAuth middleware
app.get('/dashboard', (ctx) => {
  return { welcome: ctx.state.user }; // Extracted from Bearer token
}, {
  middlewares: [jwtAuth({ secret: JWT_SECRET })],
});
```

---

## 2. AES-256-CBC Encrypted Cookies & Sessions

Store sensitive state securely in cookies encrypted on the server:

```js
// Set Encrypted Cookie
app.get('/login-session', (ctx) => {
  ctx.setEncryptedCookie('user_session', { userId: 101, token: 'abc' }, 'cookie-key-secret');
  return { status: 'logged_in' };
});

// Read Encrypted Cookie
app.get('/profile', (ctx) => {
  const session = ctx.getEncryptedCookie('user_session', 'cookie-key-secret');
  return { session };
});
```
