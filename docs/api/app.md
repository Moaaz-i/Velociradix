# Application (`app`) API Reference

The `app` instance is the central application server created via `createApp()`.

> [!NOTE]
> Velociradix `app` method calls return the `app` instance, allowing fluent method chaining (`app.use().get().post().listen()`).

---

## ⚡ Server Lifecycle & Configuration

### `app.listen(port, host?, callback?)`
Binds to network socket synchronously and starts the C++ multi-threaded event loop engine.

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

### `app.printRoutes()`
Prints an ASCII route table overview of all registered routes to terminal CLI.

```javascript
app.printRoutes();
```

---

### `app.cluster(options?)`
Scales server instances across CPU cores using multi-process cluster workers.

```javascript
app.cluster({ workers: 4 });
```

---

### `app.autoScale(options?)`
Dynamically scales C++ worker thread count based on memory and CPU load.

```javascript
app.autoScale({ minWorkers: 2, maxWorkers: 8, intervalMs: 5000 });
```

---

## 🔀 Versioning & RPC

### `app.versioning(versionsMap, options?)`
Multi-version API router supporting `X-API-Version` header and path prefixes (`/v1`, `/v2`):

```javascript
app.versioning({
  v1: appV1,
  v2: appV2
});
```

---

### `app.rpc(path, procedures)`
Registers a JSON-RPC 2.0 endpoint for procedure calls:

```javascript
app.rpc('/rpc', {
  multiply: ({ a, b }) => a * b
});
```

---

## 📁 File-Based Routing & Mocking

### `app.autoRoute(dirPath, basePrefix?)`
Automatically scans directory files and registers route handlers synchronously:

```javascript
app.autoRoute('./routes');
```

---

### `app.autoRouteAsync(dirPath, basePrefix?)`
Asynchronous file-system route loader that returns a `Promise<App>`:

```javascript
await app.autoRouteAsync('./routes', '/api/v1');
```

---

### `app.mockServer(routesMap)`
Registers mock API endpoints with simulated latency delay:

```javascript
app.mockServer({
  'GET /api/users': { status: 200, delayMs: 100, body: [{ id: 1 }] }
});
```

---

## 🔌 WebSockets, GraphQL & Real-Time

### `app.ws(path, handler)`
Registers a native WebSocket upgrade route listener:

```javascript
app.ws('/chat', (socket) => {
  socket.send('Connected to WebSocket!');
  socket.broadcast('New user joined');
});
```

---

### `app.graphql(path, schema, resolvers)`
Hosts a zero-dependency GraphQL query and mutation endpoint:

```javascript
app.graphql('/graphql', `type Query { hello: String }`, {
  hello: () => 'Hello GraphQL'
});
```

---

### `app.sseBroadcast(channel, data)`
Broadcasts a Server-Sent Event (SSE) payload to all connected channel clients:

```javascript
app.sseBroadcast('live-updates', { time: Date.now() });
```

---

## 📊 Benchmarking & Observability

### `app.bench(options?)`
Runs an automated local benchmark test measuring RPS and total duration:

```javascript
const stats = await app.bench({ iterations: 1000, path: '/api/users' });
console.log(`Throughput: ${stats.rps} req/sec`);
```

---

### `app.metricsUI(path?)`
Mounts a live HTML & JSON metrics dashboard at the specified path (default: `/velociradix/metrics`).

```javascript
app.metricsUI('/velociradix/metrics');
```
