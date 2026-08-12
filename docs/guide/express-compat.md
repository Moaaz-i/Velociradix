# Express Middleware Compatibility (`app.useExpress`)

Velociradix provides seamless **100% backward-compatibility** for the entire Express.js middleware ecosystem via `app.useExpress()`.

This enables you to leverage existing, battle-tested Express middlewares (`cors`, `morgan`, `cookie-parser`, `express-session`, `passport`, `multer`, `helmet`, `compression`, etc.) inside Velociradix with zero code modifications.

---

## 🚀 Quick Usage Example

```js
import { createApp } from 'velociradix';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

const app = createApp();

// 1. HTTP Request Logger (Morgan) - Full EventEmitter & timing support
app.useExpress(morgan('combined'));

// 2. Security Headers (Helmet)
app.useExpress(helmet());

// 3. CORS Configuration
app.useExpress(cors({ origin: '*' }));

// 4. Cookie Parsing
app.useExpress(cookieParser('secret-key'));

// 5. Mount Existing Express Router Instances
import { Router } from 'express';
const router = Router();
router.get('/users', (req, res) => res.json([{ id: 1, name: 'Alice' }]));

app.useExpressRouter('/v1', router);

// 6. Custom Express Middleware using standard req / res APIs
app.useExpress((req, res, next) => {
  res.setHeader('X-Powered-By', 'Velociradix + Express Engine Bridge');
  req.customTimestamp = Date.now();
  next();
});

app.get('/api', (ctx) => {
  return { 
    message: 'Running with Express 100% API Compatibility Layer',
    timestamp: ctx.req.customTimestamp 
  };
});

app.listen(3000, () => {
  console.log('Server running with Express compatibility at http://localhost:3000');
});
```

---

## 🛠️ Supported Express APIs & Features

The `app.useExpress(fn)` bridge transparently wraps and maps Velociradix's internal request context into a complete, spec-compliant Express `req` and `res` pair:

### 📥 Express Request (`req`) Compatibility
- **Request Metadata:** `req.url`, `req.originalUrl`, `req.baseUrl`, `req.path`, `req.method`
- **Data Containers:** `req.params`, `req.query`, `req.body`, `req.cookies`, `req.signedCookies`
- **Network & IP:** `req.ip`, `req.ips`, `req.protocol`, `req.secure`, `req.hostname`, `req.subdomains`, `req.xhr`
- **Sockets & Timing:** `req.socket`, `req.connection`, `req._startTime`, `req.fresh`, `req.stale`
- **Helper Methods:**
  - `req.get(headerName)` / `req.header(headerName)`
  - `req.is(type)`
  - `req.accepts()`, `req.acceptsEncodings()`, `req.acceptsCharsets()`, `req.acceptsLanguages()`
  - `req.param(name, defaultValue)`

### 📤 Express Response (`res`) Compatibility
- **Response Metadata & Locals:** `res.statusCode`, `res.statusMessage`, `res.headersSent`, `res.locals`, `res.app`, `res.req`, `res._startTime`
- **Header Operations:** `res.setHeader()`, `res.getHeader()`, `res.get()`, `res.getHeaders()`, `res.getHeaderNames()`, `res.hasHeader()`, `res.removeHeader()`, `res.header()`, `res.set()`, `res.append()`, `res.vary()`
- **Cookies & Clearing:** `res.cookie(name, val, options)`, `res.clearCookie(name, options)`
- **Sending & Formatting:**
  - `res.status(code)` / `res.sendStatus(code)`
  - `res.send(body)` / `res.json(body)` / `res.jsonp(body)` / `res.text(body)` / `res.html(body)`
  - `res.type(type)` / `res.contentType(type)`
  - `res.location(url)` / `res.redirect([status], url)`
  - `res.end()` / `res.write()` / `res.writeHead()`
- **Files & Attachments:** `res.sendFile(path, opts)`, `res.download(path, filename, opts)`, `res.attachment(filename)`, `res.links()`, `res.format()`
- **Event Emitter Suite:** Full `res.on()`, `res.once()`, `res.emit()`, and `res.removeListener()` implementation — emits the `'finish'` event upon response dispatch for logging & metrics tools (such as Morgan, Response-Time, & APM loggers).

---

## ⚡ Performance Note

`app.useExpress()` introduces zero extra allocations overhead by reusing pooled context layers. It allows you to run high-performance C++ backend routing alongside your favorite Express middlewares!

