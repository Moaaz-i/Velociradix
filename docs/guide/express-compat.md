# Express Middleware Compatibility (`app.useExpress`)

Velociradix provides seamless backward-compatibility for existing Express.js ecosystem middlewares via `app.useExpress()`.

---

## Usage Example

You can easily wrap and use traditional Express middlewares (like `cors`, `morgan`, `cookie-parser`, `body-parser`, or custom Express middlewares):

```js
import { createApp } from 'velociradix';
import expressCors from 'cors';
import morgan from 'morgan';

const app = createApp();

// Use Express CORS middleware
app.useExpress(expressCors({ origin: '*' }));

// Use Express Morgan HTTP logger
app.useExpress(morgan('tiny'));

// Custom Express Middleware
app.useExpress((req, res, next) => {
  res.setHeader('X-Powered-By', 'Velociradix + Express Compatibility');
  next();
});

app.get('/api', (ctx) => {
  return { message: 'Running with Express compatibility layer' };
});

app.listen(3000);
```

---

## How It Works

`app.useExpress(fn)` provides a lightweight response shim object (`setHeader`, `getHeader`, `statusCode`, `setStatus`) compatible with Node's standard `http.ServerResponse` so existing Express middlewares execute without modifications.
