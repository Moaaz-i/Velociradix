# Schema & Zod Validation

Velociradix provides **native First-Class Zod and Schema Integration** inside `ctx.validate()`.

---

## 1. Validating with Zod

Simply pass a Zod schema directly into `ctx.validate(schema)`:

```js
import { createApp, validate } from 'velociradix';
import { z } from 'zod';

const app = createApp();

const UserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18),
});

app.post('/users', (ctx) => {
  // Automatically parses ctx.req.body and runs z.safeParse()
  ctx.validate(UserSchema);

  return { status: 'created', user: ctx.state.cleanedBody || ctx.req.body };
});
```

If validation fails, Velociradix automatically throws a `BadRequestError` (HTTP 400) with detailed issues formatted:
`Invalid body: email: Invalid email, age: Expected number, received string`

---

## 2. Validating Params, Query & Body Together

You can also pass a full validation schema object:

```js
app.post('/items/:category', (ctx) => {
  ctx.validate({
    params: (p) => (!['tech', 'books'].includes(p.category) ? 'Invalid category' : undefined),
    query: (q) => (!q.page ? 'Page parameter required' : undefined),
    body: UserSchema, // Zod schema for body validation
  });

  return { ok: true };
});
```
