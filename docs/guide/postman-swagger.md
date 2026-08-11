# Postman & Swagger / OpenAPI Integration

Velociradix comes with zero-dependency, built-in interactive UI generators for both **Postman Documentation** and **Swagger / OpenAPI 3.0 Specification**.

---

## 🚀 1. Built-in Postman UI Generator

You can expose a self-hosted Postman Documentation & API Playground interface directly from your Velociradix application using `app.postmanDoc()`.

### Basic Usage

```js
import { createApp } from 'velociradix';

const app = createApp();

app.get('/api/users', (ctx) => {
  return ctx.json({ users: [{ id: 1, name: 'Alice' }] });
}, {
  name: 'Get All Users',
  description: 'Fetches the list of all registered users.'
});

app.post('/api/users', (ctx) => {
  return ctx.status(201).json({ success: true });
}, {
  name: 'Create User',
  body: { name: 'Bob', age: 25 }
});

// Expose Postman UI at /postman-docs
app.postmanDoc('/postman-docs', {
  name: 'Velociradix API Docs'
});

app.listen(3000);
```

Visit `http://localhost:3000/postman-docs` in your browser to view and interact with your Postman API Playground.

---

## 📥 2. Exporting Postman Collection JSON

You can generate a valid **Postman Collection (v2.1.0)** JSON programmatically using `app.postman()` for import into the Postman Desktop App.

```js
// Expose the raw Postman Collection JSON endpoint
app.get('/postman.json', (ctx) => {
  const collection = app.postman({
    name: 'My App API Collection',
    baseUrl: 'http://localhost:3000'
  });
  return ctx.json(collection);
});
```

### Importing into Postman Desktop:
1. Open **Postman Desktop**.
2. Click **Import** (top left).
3. Paste `http://localhost:3000/postman.json` or download the JSON payload and drop it into Postman.

---

## 📜 3. Swagger / OpenAPI 3.0 UI

Velociradix also includes an interactive **Swagger UI** generator out of the box via `app.swagger()` and OpenAPI spec via `app.openapi()`.

```js
// Serve interactive Swagger UI at /docs
app.swagger('/docs');

// Expose raw OpenAPI 3.0 JSON spec
app.get('/openapi.json', (ctx) => {
  return ctx.json(app.openapi({ title: 'My API Spec', version: '1.0.0' }));
});
```

Visit `http://localhost:3000/docs` to inspect endpoints and test requests live.

---

## 🔒 4. Production Security Best Practices

In production environments, restrict access to API documentation interfaces:

```js
// Restrict docs to development mode
if (process.env.NODE_ENV !== 'production') {
  app.postmanDoc('/postman-docs');
  app.swagger('/docs');
}
```

