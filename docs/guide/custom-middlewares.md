# Complete Guide: Writing High-Performance Custom Middlewares for Velociradix

A comprehensive, production-ready reference guide detailing everything a developer needs to know to architect, build, optimize, and publish custom middlewares for **Velociradix**.

---

## 💡 Middleware Execution & Lifecycle Core Concepts

In Velociradix, a middleware is an asynchronous or synchronous function receiving two arguments:
1. `ctx` (`Context`): The unified object encapsulating the incoming client request and outgoing server response.
2. `next` (`Function`): An asynchronous continuation function that yields execution to the next middleware or final route handler in the chain.

```ts
type Middleware = (ctx: Context, next: () => Promise<void> | void) => Promise<void> | void;
```

### The Onion Execution Lifecycle Model

Velociradix executes middlewares in an **Onion (Cascading) Lifecycle Model**:

```
[Request In] ──► Middleware 1 (Before) ──► Middleware 2 (Before) ──► Route Handler
                                                                            │
[Response Out] ◄── Middleware 1 (After) ◄── Middleware 2 (After) ◄──────────┘
```

Everything executing **before** `await next()` runs prior to the route handler. Everything executing **after** `await next()` (or inside `finally`) runs during response cleanup after downstream handlers complete.

---

## 🏗️ Pattern 1: The Configurable Closure Pattern (Recommended for NPM Packages)

The closure pattern is the industry standard for publishing reusable NPM middlewares. An outer factory function receives user options and returns the internal `(ctx, next)` handler.

### Complete Production Example: Advanced HTTP Logger with Colors, Formats & Error Trapping

```js
import { HttpError } from 'velociradix';

/**
 * Advanced Custom Logger Middleware Factory
 * @param {Object} opts
 * @param {'dev'|'tiny'|'json'} [opts.format='dev'] Log format
 * @param {boolean} [opts.colored=true] Enable ANSI colors
 * @param {Function} [opts.logger=console.log] Custom output logger function
 */
export function customLogger(opts = {}) {
  const format = opts.format || 'dev';
  const colored = opts.colored ?? true;
  const logFn = opts.logger ?? console.log;

  const colorizeStatus = (status) => {
    if (!colored) return status;
    if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // Red
    if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // Yellow
    if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // Cyan
    return `\x1b[32m${status}\x1b[0m`; // Green
  };

  return async (ctx, next) => {
    const start = Date.now();
    try {
      await next();
    } catch (err) {
      // Correctly capture status code from thrown HttpErrors or uncaught exceptions
      const errStatus = (ctx.statusCode && ctx.statusCode !== 200)
        ? ctx.statusCode
        : (err instanceof HttpError ? err.status : ((err && err.status) || 500));
      ctx.statusCode = errStatus;
      throw err; // Re-throw so app.onError or parent error handlers process it
    } finally {
      const duration = Date.now() - start;
      const status = ctx.statusCode || 200;
      const method = ctx.method;
      const path = ctx.path;

      if (format === 'dev') {
        const coloredMethod = colored ? `\x1b[36m${method}\x1b[0m` : method;
        logFn(`${coloredMethod} ${path} ${colorizeStatus(status)} \x1b[90m${duration}ms\x1b[0m`);
      } else if (format === 'json') {
        logFn(JSON.stringify({
          timestamp: new Date().toISOString(),
          method,
          path,
          status,
          durationMs: duration,
          ip: ctx.ip,
          userAgent: ctx.get('user-agent'),
        }));
      } else {
        logFn(`${method} ${path} ${status} - ${duration}ms`);
      }
    }
  };
}

// Usage in your Velociradix App:
app.use(customLogger({ format: 'dev', colored: true }));
```

---

## 🏗️ Pattern 2: The Direct Stateless Function Pattern (Zero Memory Allocation)

If your middleware doesn't need custom options, define a standalone top-level function. This avoids function creation overhead and closure memory allocations, delivering peak performance for high-throughput routes.

### Complete Production Example: High-Precision Response Time APM Header

```js
/**
 * Direct Stateless Response Time APM Middleware
 * Injects precision server timing and X-Response-Time headers.
 */
export async function responseTimeGuard(ctx, next) {
  const start = process.hrtime.bigint();
  
  await next();
  
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;
  
  ctx.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
  ctx.setHeader('Server-Timing', `total;dur=${durationMs.toFixed(2)}`);
}

// Usage in your Velociradix App:
app.use(responseTimeGuard);
```

---

## 🏗️ Pattern 3: The Stateful Class-Based Pattern (Complex Enterprise Guards)

Best for complex enterprise features requiring internal state management, sliding window maps, cache stores, or periodic garbage collection timers.

### Complete Production Example: Dynamic IP Rate Limiter with Sliding Window & Auto GC

```js
/**
 * Enterprise Stateful Rate Limiter Class
 */
export class RateLimiter {
  constructor(opts = {}) {
    this.windowMs = opts.windowMs || 60000; // 1 minute window
    this.max = opts.max || 100; // 100 requests max
    this.hits = new Map();

    // Periodic Garbage Collection timer to prevent unbounded Map memory leaks
    this.gcInterval = setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of this.hits.entries()) {
        if (now > record.resetTime) {
          this.hits.delete(ip);
        }
      }
    }, this.windowMs);

    // Unref timer so it doesn't prevent Node process termination
    if (this.gcInterval.unref) {
      this.gcInterval.unref();
    }
  }

  /**
   * Returns the middleware handler function
   */
  middleware() {
    return (ctx, next) => {
      const ip = ctx.ip;
      const now = Date.now();
      let record = this.hits.get(ip);

      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + this.windowMs };
        this.hits.set(ip, record);
      } else {
        record.count++;
      }

      ctx.setHeader('X-RateLimit-Limit', this.max);
      ctx.setHeader('X-RateLimit-Remaining', Math.max(0, this.max - record.count));
      ctx.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

      if (record.count > this.max) {
        ctx.status(429);
        return ctx.json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`,
          statusCode: 429,
        });
      }

      return next();
    };
  }

  /**
   * Graceful cleanup of background timers
   */
  destroy() {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
    }
  }
}

// Usage in your Velociradix App:
const limiter = new RateLimiter({ max: 50, windowMs: 30000 });
app.use(limiter.middleware());
```

---

## 🛠️ TypeScript Support & Type Declarations

When writing custom middlewares in TypeScript, import the built-in `Context` and `Middleware` types directly from `velociradix`:

```ts
import { Context, Middleware, HttpError } from 'velociradix';

export interface AuthOptions {
  secret: string;
  headerName?: string;
}

export function apiKeyAuth(opts: AuthOptions): Middleware {
  const headerName = (opts.headerName || 'x-api-key').toLowerCase();
  
  return async (ctx: Context, next: () => Promise<void> | void) => {
    const apiKey = ctx.get(headerName);
    if (!apiKey || apiKey !== opts.secret) {
      ctx.status(401);
      return ctx.json({ error: 'Unauthorized: Invalid API Key' });
    }
    await next();
  };
}
```

---

## 🚨 Best Practices & Common Gotchas

1. **Always `await next()`**: Forgetting `await` before `next()` causes downstream handlers to execute asynchronously outside the try/catch/finally block.
2. **Always Re-throw Unhandled Errors**: If your middleware catches errors for logging or cleanup, always `throw err` at the end so `app.onError()` can process the error response.
3. **Avoid Unbounded Maps**: Always use `.unref()` on `setInterval` cleanup timers in stateful middlewares to avoid holding Node.js event loop open or causing memory leaks.
4. **Use `ctx.state` for Context Passing**: Attach custom variables (like authenticated user payload or session tokens) to `ctx.state` rather than mutating `ctx` properties directly.
