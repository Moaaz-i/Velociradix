# OOP & Decorators Architecture

Velociradix provides a dedicated **Decorators & Dependency Injection module** (`velociradix/decorators`), allowing you to write clean, class-based controllers (similar to NestJS or Spring Boot) while maintaining **maximum C++ native routing performance**.

---

## 1. Quick Example

```typescript
import { createApp } from 'velociradix';
import { Controller, Get, Post, Body, Param, Query, Use, Injectable, Inject } from 'velociradix/decorators';

// 1. Define an Injectable Service
@Injectable()
class UserService {
  private users = [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' }
  ];

  findAll() { return this.users; }
  findOne(id: number) { return this.users.find(u => u.id === id); }
  create(data: any) { this.users.push(data); return data; }
}

// 2. Define a Decorated Controller
@Controller('/users')
class UserController {
  @Inject(UserService)
  private userService: UserService;

  @Get('/')
  getAllUsers(@Query('role') role: string) {
    const all = this.userService.findAll();
    return role ? all.filter(u => u.role === role) : all;
  }

  @Get('/:id')
  getUserById(@Param('id') id: string) {
    const user = this.userService.findOne(Number(id));
    return user || { error: 'Not found' };
  }

  @Post('/')
  createUser(@Body() body: any) {
    return this.userService.create(body);
  }
}

// 3. Register Controller onto App
const app = createApp();
app.registerController(UserController);

app.listen(3000);
```

---

## 2. Available Decorators

### Class Decorators
* **`@Controller(prefix?, options?)`**: Marks class as a route group with an optional URL prefix.
* **`@Injectable()`**: Marks a class as a registered injectable dependency in the IoC container.

### Method Decorators (Route Verbs)
* **`@Get(path?)`**
* **`@Post(path?)`**
* **`@Put(path?)`**
* **`@Delete(path?)`**
* **`@Patch(path?)`**
* **`@Head(path?)`**
* **`@Options(path?)`**
* **`@All(path?)`**

### Parameter Decorators
* **`@Body(property?)`**: Injects request body or specific field.
* **`@Param(name?)`**: Injects route parameter (e.g. `:id`).
* **`@Query(name?)`**: Injects query string parameter.
* **`@Headers(name?)`**: Injects HTTP request header.
* **`@Ctx()`**: Injects the full Velociradix `Context` object.
* **`@State(property?)`**: Injects `ctx.state`.

### Middleware Decorators
* **`@Use(...middlewares)`**: Applies middlewares to an entire controller class or specific action method.
* **`@Validate(schema)`**: Applies automatic schema validation to an action method.

---

## 3. TypeScript Setup

Ensure your `tsconfig.json` enables experimental decorators:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```
