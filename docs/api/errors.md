# HTTP Error Classes & Exception Handling

Velociradix provides structured, built-in HTTP Exception classes for clean error handling.

---

## 1. Built-in Error Classes

| Error Class | Status Code | Default Message |
| :--- | :---: | :--- |
| `BadRequestError` | **400** | `Bad Request` |
| `UnauthorizedError` | **401** | `Unauthorized` |
| `ForbiddenError` | **403** | `Forbidden` |
| `NotFoundError` | **404** | `Not Found` |
| `InternalServerError` | **500** | `Internal Server Error` |
| `HttpError` (Base Class) | `status` | Custom message & details |

---

## 2. Throwing Errors in Route Handlers

```js
import { createApp, BadRequestError, UnauthorizedError } from 'velociradix';

const app = createApp();

app.get('/protected', (ctx) => {
  const token = ctx.bearerToken();
  if (!token) {
    throw new UnauthorizedError('Bearer token is required', { realm: 'API' });
  }

  if (token !== 'secret123') {
    throw new BadRequestError('Invalid token credentials');
  }

  return { secretData: 'ok' };
});
```

---

## 3. Global Custom Error Handler (`app.onError`)

Catch all thrown exceptions centrally:

```js
app.onError((err, ctx) => {
  const status = err.status || 500;
  ctx.status(status);
  
  return ctx.json({
    success: false,
    error: err.message,
    status,
    details: err.details || null,
  });
});
```
