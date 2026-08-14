# Routing & Path Parameters

Velociradix features a high-performance **C++ Radix Trie router** capable of handling literal paths, dynamic route parameters, wildcards, route grouping with scoped middlewares, and fast C++ routes.

> [!TIP]
> Because Velociradix utilizes a native C++ Radix Trie router, route lookup time is $O(k)$ where $k$ is the URL path length. Registering hundreds of routes will not degrade lookup latency.

> [!WARNING]
> Literal path segments always take precedence over dynamic parameters. If both `/users/profile` and `/users/:id` are defined, `/users/profile` will match the literal handler first.

---

## 1. Route Path Parameters (`:param`)

Capture URL path dynamic segments using the `:paramName` syntax. Access them directly via `ctx.params`:

```javascript
app.get('/users/:id', (ctx) => {
  const userId = ctx.params.id;
  return ctx.json({ userId });
});

app.get('/posts/:category/:slug', (ctx) => {
  const { category, slug } = ctx.params;
  return ctx.json({ category, slug });
});
```

---

## 2. Wildcard Routes (`/*`)

Match any sub-path or fallback routes using wildcards:

```javascript
// Capture all static asset requests under /static/
app.get('/static/*', (ctx) => {
  return ctx.sendFile(`./public/${ctx.params['*']}`);
});

// Custom 404 Wildcard Fallback Handler
app.notFound((ctx) => {
  return ctx.status(404).json({ error: 'Route not found' });
});
```

---

## 3. Route Groups & Scoped Middlewares

Organize related endpoints cleanly with `app.group()`. You can attach scoped middlewares that only apply to the group:

```javascript
import { app, jwtAuth, rateLimit } from 'velociradix';

// 1. Group with inline middlewares
app.group('/api/v1', [rateLimit({ max: 60 })], (v1) => {
  v1.get('/health', (ctx) => ctx.json({ status: 'ok' }));
  
  // 2. Nested protected group
  v1.group('/admin', [jwtAuth({ secret: 'admin-secret' })], (admin) => {
    admin.get('/metrics', (ctx) => ctx.json({ activeUsers: 42 }));
    admin.post('/settings', (ctx) => ctx.json({ updated: true }));
  });

  // 3. Dynamic scoped middleware using g.use()
  v1.group('/users', (users) => {
    users.use((ctx, next) => {
      ctx.setHeader('X-User-Scope', 'active');
      return next();
    });
    
    users.get('/', (ctx) => ctx.json([]));
    users.get('/:id', (ctx) => ctx.json({ id: ctx.params.id }));
    users.post('/', (ctx) => ctx.status(201).json({ created: true }));
  });
});
```

---

## 4. HTTP Method Handlers

Velociradix supports all standard HTTP verbs with full method chaining:

```javascript
app.get('/items', handler);
app.post('/items', handler);
app.put('/items/:id', handler);
app.patch('/items/:id', handler);
app.delete('/items/:id', handler);
app.head('/items/:id', handler);
app.options('/items', handler);
app.all('/universal', handler); // Matches all HTTP methods
```

---

## 5. Route Metadata (Swagger & Postman Documentation)

You can pass descriptive metadata to any route registration for automatic OpenAPI/Swagger and Postman collection generation:

```javascript
app.get('/api/users/:id', (ctx) => {
  return { id: ctx.params.id, name: 'Alice' };
}, {
  name: 'Get User By ID',
  description: 'Retrieves user profile information by unique identifier',
  query: ['fields'],
  responses: [
    { code: 200, name: 'Success', body: { id: '1', name: 'Alice' } },
    { code: 404, name: 'User Not Found', body: { error: 'Not Found' } }
  ]
});
```

---

## 6. Fast-Path C++ Routes (`app.fastGet` / `app.fastRoute`)

For static responses, cached data, or health endpoints where JS overhead is unnecessary, register routes directly in C++ for maximum throughput:

```javascript
// Answered entirely in C++ without touching V8 JavaScript thread
app.fastGet('/health', { status: 'healthy', version: '7.4.0' });
app.fastRoute('GET', '/robots.txt', 'User-agent: *\nDisallow: /admin', 200, {
  'Content-Type': 'text/plain'
});
```
