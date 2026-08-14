# File-Based Routing (`app.autoRoute`)

Velociradix includes a built-in **File-System Router** that turns files and folders inside a `routes/` directory into HTTP endpoints automatically—eliminating the need to register each route manually in `server.ts`.

---

## 📂 1. Default Project Structure

```text
my-velociradix-app/
├── package.json
├── tsconfig.json             # (If using TypeScript)
├── server.ts (or server.mjs) # Entry point (calls app.autoRoute & app.listen)
└── routes/                   # File-system routes folder
    ├── index.ts              # ➔ GET /
    ├── health.ts             # ➔ GET /health
    ├── about.ts              # ➔ GET /about
    ├── api/
    │   └── version.ts        # ➔ GET /api/version
    ├── users/
    │   ├── index.ts          # ➔ GET /users, POST /users
    │   ├── profile.ts        # ➔ GET /users/profile
    │   └── [id].ts           # ➔ GET /users/:id, PATCH /users/:id, DELETE /users/:id
    └── static/
        └── [...slug].ts      # ➔ GET /static/* (Wildcard catch-all)
```

---

## 🗺️ 2. Route Path Mapping Rules

| File Path in `routes/` | Generated HTTP Route | Description |
| :--- | :--- | :--- |
| `routes/index.ts` | `/` | Root endpoint of the application. |
| `routes/health.ts` | `/health` | Direct literal path matching file name. |
| `routes/users/index.ts` | `/users` | Directory index maps to directory name. |
| `routes/users/profile.ts` | `/users/profile` | Nested sub-route. |
| `routes/users/[id].ts` | `/users/:id` | Dynamic path parameter (`ctx.params.id`). |
| `routes/posts/[category]/[slug].ts` | `/posts/:category/:slug` | Multiple dynamic parameters. |
| `routes/static/[...all].ts` | `/static/*` | Wildcard catch-all route (`ctx.params['*']`). |

---

## ✍️ 3. How to Write Route Files

Every file inside `routes/` exports named functions matching HTTP methods (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `ALL`) or a `default` handler.

### Example A: Main Page (`routes/index.ts`)
```typescript
import type { Context } from 'velociradix';

// GET /
export function GET(ctx: Context) {
  return ctx.json({ message: 'Welcome to Velociradix API' });
}
```

---

### Example B: User Resource & Middlewares (`routes/users/index.ts`)
You can export route-level `middlewares` array to protect endpoints defined in this file:

```typescript
import type { Context } from 'velociradix';
import { rateLimit } from 'velociradix';

// Middlewares applied to all methods in this file
export const middlewares = [rateLimit({ max: 50 })];

// GET /users
export function GET(ctx: Context) {
  return ctx.json([
    { id: '1', name: 'Omar' },
    { id: '2', name: 'Sara' }
  ]);
}

// POST /users
export async function POST(ctx: Context) {
  const body = await ctx.body();
  return ctx.status(201).json({ created: true, user: body });
}
```

---

### Example C: Dynamic Parameter Route (`routes/users/[id].ts`)
Dynamic segments wrapped in `[paramName]` become available in `ctx.params`:

```typescript
import type { Context } from 'velociradix';
import { jwtAuth } from 'velociradix';

// Require JWT authorization for user modifications
export const middlewares = [jwtAuth({ secret: 'app-jwt-secret' })];

// GET /users/:id
export function GET(ctx: Context) {
  return ctx.json({ id: ctx.params.id, name: 'Omar Hassan' });
}

// PATCH /users/:id
export async function PATCH(ctx: Context) {
  const updates = await ctx.body();
  return ctx.json({ id: ctx.params.id, updated: true, updates });
}

// DELETE /users/:id
export function DELETE(ctx: Context) {
  return ctx.json({ id: ctx.params.id, deleted: true });
}
```

---

### Example D: Wildcard Route (`routes/static/[...slug].ts`)
```typescript
import type { Context } from 'velociradix';

// GET /static/*
export function GET(ctx: Context) {
  const filePath = ctx.params['*'];
  return ctx.sendFile(`./public/${filePath}`);
}
```

---

### Example E: Route Metadata & OpenAPI/Swagger (`routes/orders.ts`)
Export an `options` object to generate OpenAPI/Swagger documentation automatically:

```typescript
import type { Context } from 'velociradix';

export const options = {
  name: 'Create Order',
  description: 'Places a new customer order and generates invoice',
  body: { productId: '123', quantity: 2 }
};

export async function POST(ctx: Context) {
  const data = await ctx.body();
  return ctx.status(201).json({ orderId: 'ord_99', data });
}
```

---

## ⚡ 4. Loading Routes in `server.ts`

### Synchronous Loading (`app.autoRoute`):
```typescript
import { createApp, logger, helmet, cors } from 'velociradix';

const app = createApp();

// Global Middlewares
app.use(logger());
app.use(helmet());
app.enableCors({ origin: '*' });

// Auto-register routes from ./routes folder
app.autoRoute('./routes');

// Optional: Mount under a base prefix like /api/v1
// app.autoRoute('./routes/api', '/api/v1');

app.listen(3000, () => {
  console.log('⚡ Server running at http://localhost:3000');
});
```

---

### Asynchronous Loading with Promise (`app.autoRouteAsync`):
If you want to ensure all route modules are fully imported before opening server sockets:

```typescript
import { createApp } from 'velociradix';

const app = createApp();

async function start() {
  await app.autoRouteAsync('./routes');
  
  app.listen(3000, () => {
    console.log('⚡ Server ready on http://localhost:3000');
  });
}

start();
```
