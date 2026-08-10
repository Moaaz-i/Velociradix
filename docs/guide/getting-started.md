# Getting Started with Velociradix

## Installation

Install Velociradix via npm:

```bash
npm install velociradix
```

Velociradix includes precompiled native binaries (`prebuilds/`) for Linux (`x64`), macOS (`arm64`), and Windows (`x64`). If a prebuilt binary is available, installation is **instant**.

---

## Basic Server Example

```js
import { createApp, logger, helmet } from 'velociradix';

const app = createApp();

app.use(logger());
app.use(helmet());

app.get('/', (ctx) => {
  return { message: 'Hello from Velociradix!' };
});

app.get('/users/:id', (ctx) => {
  return { userId: ctx.params.id, search: ctx.query('q') };
});

app.listen(3000, () => {
  console.log('⚡ Server running at http://localhost:3000');
});
```

---

## TypeScript Usage

```ts
import { createApp, Context, BadRequestError } from 'velociradix';

interface UserProfile {
  id: number;
  name: string;
}

const app = createApp();

app.get('/users/:id', async (ctx: Context) => {
  const id = Number(ctx.params.id);
  if (isNaN(id)) {
    throw new BadRequestError('Invalid User ID');
  }
  const user: UserProfile = { id, name: 'Moaaz' };
  return ctx.json(user);
});

app.listen(3000);
```
