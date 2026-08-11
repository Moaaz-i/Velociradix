# Postman & Swagger / OpenAPI Integration

Velociradix comes with zero-dependency, built-in interactive UI generators for both **Postman Documentation** and **Swagger / OpenAPI 3.0 Specification**.

---

## 🚀 1. Built-in Postman UI Generator

You can expose a self-hosted Postman Documentation & API Playground interface directly from your Velociradix application.

### Basic Usage

```js
import velociradix from 'velociradix';

const app = velociradix();

app.get('/api/users', (ctx) => {
  return ctx.json({ users: [{ id: 1, name: 'Alice' }] });
});

app.post('/api/users', (ctx) => {
  return ctx.status(201).json({ success: true });
});

// Expose Postman UI at /docs/postman
app.postmanUI('/docs/postman', {
  title: 'Velociradix API Docs',
  version: '1.0.0'
});

app.listen(3000);
```

Visit `http://localhost:3000/docs/postman` in your browser to view and interact with your Postman API Playground.

---

## 📥 2. Exporting Postman Collection JSON

You can generate a valid **Postman Collection (v2.1.0)** JSON programmatically for import into the Postman Desktop App.

```js
// Expose the raw Postman Collection JSON endpoint
app.get('/docs/postman.json', (ctx) => {
  const collection = app.generatePostmanCollection({
    title: 'My App API Collection',
    baseUrl: 'http://localhost:3000'
  });
  return ctx.json(collection);
});
```

### Importing into Postman Desktop:
1. Open **Postman Desktop**.
2. Click **Import** (top left).
3. Paste `http://localhost:3000/docs/postman.json` or download the JSON file and drop it into Postman.

---

## 📜 3. Swagger / OpenAPI 3.0 UI

Velociradix also includes an interactive **Swagger UI** generator out of the box.

```js
// Serve Swagger UI at /docs/swagger
app.swaggerUI('/docs/swagger', {
  title: 'Velociradix OpenAPI Spec',
  version: '1.0.0'
});
```

Visit `http://localhost:3000/docs/swagger` to inspect endpoints, schemas, and test requests live.

---

## 🔒 4. Production Security Best Practices

In production environments, restrict access to API documentation interfaces:

```js
// Restrict docs to development mode or authenticated admin users
if (process.env.NODE_ENV !== 'production') {
  app.postmanUI('/docs/postman');
  app.swaggerUI('/docs/swagger');
}
```
