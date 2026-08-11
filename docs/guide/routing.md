# Routing & Path Parameters

Velociradix features a high-performance **C++ Radix Trie router** capable of handling literal paths, dynamic route parameters, wildcards, and route grouping.

---

## 1. Route Path Parameters (`:param`)

Capture URL path dynamic segments using the `:paramName` syntax. Access them directly via `ctx.params`:

```js
app.get('/users/:id', (ctx) => {
  const userId = ctx.params.id;
  return { userId };
});

app.get('/posts/:category/:slug', (ctx) => {
  const { category, slug } = ctx.params;
  return { category, slug };
});
```

---

## 2. Wildcard Routes (`/*`)

Match any sub-path or fallback routes using wildcards:

```js
// Capture all static asset requests under /static/
app.get('/static/*', (ctx) => {
  return ctx.sendFile(`./public/${ctx.params['*']}`);
});

// Custom 404 Wildcard Handler
app.notFound((ctx) => {
  return ctx.status(404).json({ error: 'Route not found' });
});
```

---

## 3. Route Groups & Path Prefixing

Organize related endpoints cleanly with `app.group()`:

```js
app.group('/api/v1', (v1) => {
  v1.get('/health', (ctx) => ctx.send('ok'));
  
  v1.group('/users', (users) => {
    users.get('/', (ctx) => ctx.json([]));
    users.get('/:id', (ctx) => ctx.json({ id: ctx.params.id }));
    users.post('/', (ctx) => ctx.status(201).json({ created: true }));
  });
});
```

---

## 4. HTTP Method Handlers

Velociradix supports all standard HTTP verbs:

```js
app.get('/items', handler);
app.post('/items', handler);
app.put('/items/:id', handler);
app.patch('/items/:id', handler);
app.delete('/items/:id', handler);
app.all('/universal', handler); // Matches all HTTP methods
```
