# Schema Validation & Type Safety

Velociradix provides **native First-Class Schema Validation** supporting **Zod**, **TypeBox**, **Valibot**, custom validation functions, and built-in validation rules with zero overhead.

---

## 1. Declarative Route Schema

You can pass a `schema` directly in the route definition. Velociradix will automatically validate incoming request bodies, query strings, headers, and route parameters:

```typescript
import { createApp } from 'velociradix';
import { z } from 'zod';

const app = createApp();

const CreateUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18),
});

app.post('/users', {
  schema: {
    body: CreateUserSchema,
    query: z.object({ ref: z.string().optional() }),
  }
}, async (ctx) => {
  // ctx.validBody contains the sanitized, strongly typed data
  const { username, email, age } = ctx.validBody;
  return ctx.status(201).json({ success: true, user: { username, email, age } });
});
```

---

## 2. Zero-Dependency Built-in Rules

If you do not want to install any external validation library, you can use Velociradix's built-in rule definitions:

```typescript
app.post('/products', {
  schema: {
    body: {
      name: { type: 'string', required: true, min: 2 },
      price: { type: 'number', required: true, min: 0.01 },
      category: { type: 'string', required: true },
      tags: { type: 'array', required: false }
    },
    query: {
      storeId: { type: 'number', required: true }
    }
  }
}, async (ctx) => {
  return ctx.json({ product: ctx.validBody });
});
```

---

## 3. Supported Validators

| Validator | Supported Engine | Example |
| :--- | :--- | :--- |
| **Zod** | `safeParse()`, `parse()`, `safeParseAsync()` | `z.object({ name: z.string() })` |
| **TypeBox** | `TypeCompiler.Check()`, `Type.Object()` | `Type.Object({ name: Type.String() })` |
| **Valibot** | `safeParse()`, `_parse()` | `v.object({ name: v.string() })` |
| **Built-in Rules** | `{ type, required, min, max, pattern, custom }` | `{ email: { type: 'email', required: true } }` |
| **Custom Function** | `(data) => string \| boolean \| undefined` | `(data) => data.id > 0 ? undefined : 'id must be positive'` |

---

## 4. Imperative Validation with `ctx.validate()`

You can also run validation on-demand inside your handler:

```typescript
app.get('/items/:id', (ctx) => {
  ctx.validate({
    params: { id: { type: 'number', required: true } },
    query: { filter: { type: 'string', required: false } }
  });

  return ctx.json({ id: ctx.validParams.id });
});
```

---

## 5. Automatic Error Response (HTTP 400)

When validation fails, Velociradix automatically throws a formatted `BadRequestError` (400) with detailed issues:

```json
{
  "error": "Invalid body: email: Invalid email address, age: Number must be greater than or equal to 18",
  "status": 400,
  "details": {
    "issues": [
      { "path": ["email"], "message": "Invalid email address" },
      { "path": ["age"], "message": "Number must be greater than or equal to 18" }
    ]
  }
}
```

---

## 6. Auto-Sync with OpenAPI / Swagger UI

Routes with schemas automatically generate parameter tables and JSON body payloads in the interactive **Swagger UI** (`app.swagger('/docs')`) and **Postman collection** without any manual configuration!
