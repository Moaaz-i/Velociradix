# Application (`app`) API Reference

The `app` instance is the central application server created via `createApp()`.

> [!NOTE]
> Velociradix `app` method calls return the `app` instance, allowing fluent method chaining (`app.use().get().post().listen()`).

---

## ⚡ Server Lifecycle & Configuration

### `app.listen(port, host?, callback?)`
Binds to network socket synchronously and starts the C++ multi-threaded event loop engine.
- **`port`**: `number` - Port number (e.g. `3000`).
- **`host`**: `string` - Bind host address (default: `'0.0.0.0'`).
- **`callback`**: `Function` - Callback executed once server starts listening.

> [!IMPORTANT]
> If the requested port is already in use by another server or process, `app.listen()` throws a synchronous native exception: `Error: velociradix: bind() failed - Port <port> is already in use`.

```javascript
app.listen(3000, '127.0.0.1', () => {
  console.log('Server running on http://127.0.0.1:3000');
});
```

---

### `app.close()`
Stops worker threads and closes open server listening sockets cleanly.

```javascript
app.close();
```

---

### `app.onShutdown(callback)`
Registers a cleanup callback executed when receiving `SIGINT` or `SIGTERM` signals or calling `app.close()`.

```javascript
app.onShutdown(async () => {
  console.log('Closing database connection pools...');
  await db.disconnect();
});
```

---

### `app.gracefulShutdown(options?)`
Subscribes to process `SIGINT` and `SIGTERM` signals to perform orderly server shutdown.

```javascript
app.gracefulShutdown({
  onShutdown() {
    console.log('Server process exiting safely.');
  }
});
```

---

### `app.cluster(options?)`
Scales server instances across CPU cores using multi-process cluster workers.

```javascript
app.cluster({ workers: 4 });
app.listen(3000);
```

---

## 🔄 Express Ecosystem Integration

### `app.useExpress(middleware)`
Mounts standard Express.js middlewares (e.g. `morgan`, `helmet`, `cors`, `cookie-parser`, `multer`) with spec-compliant EventEmitter stream wrappers.

```javascript
import morgan from 'morgan';
import helmet from 'helmet';

app.useExpress(morgan('dev'));
app.useExpress(helmet());
```

---

### `app.useExpressRouter([prefix], expressRouter)`
Mounts an existing `Express.Router()` instance under an optional path prefix.

```javascript
import { Router } from 'express';

const apiRouter = Router();
apiRouter.get('/users', (req, res) => res.json([{ id: 1 }]));

app.useExpressRouter('/v1', apiRouter);
```

---

## 📊 Documentation & Observability

### `app.metricsUI(path?)`
Mounts a live HTML & JSON metrics dashboard at the specified path (default: `/velociradix/metrics`).

```javascript
app.metricsUI('/velociradix/metrics');
```

---

### `app.exportOpenAPI(specOpts?)`
Generates and returns an OpenAPI 3.0 specification JSON object for all registered routes.

```javascript
const spec = app.exportOpenAPI({
  title: 'Production API',
  version: '1.0.0'
});
```

---

### `app.exportPostman(collectionName?)`
Generates and returns a Postman Collection v2.1.0 specification JSON object.

```javascript
const collection = app.exportPostman('My App Collection');
```

---

### `app.swagger(docsPath?)`
Hosts an interactive Swagger UI web interface at the specified URL path (default: `/docs`).

```javascript
app.swagger('/docs');
```

---

### `app.health(path?, checkFn?)`
Registers a system health status check endpoint.

```javascript
app.health('/health', async () => {
  const dbStatus = await checkDbConnection();
  return { db: dbStatus ? 'connected' : 'disconnected' };
});
```
