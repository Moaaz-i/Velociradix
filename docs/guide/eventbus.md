# Microservices & EventBus Engine

Velociradix includes a built-in, high-throughput **EventBus & Microservices Engine** supporting **Wildcard Subscriptions**, **Async Event Broadcasting**, and **Request-Reply RPC Patterns**.

---

## 1. Using the Built-in Application EventBus

Every Velociradix `app` instance comes with an integrated EventBus:

```typescript
import velociradix from 'velociradix';

const app = velociradix();

// 1. Subscribe to events
app.onEvent('user.registered', async (user) => {
  console.log(`Sending welcome email to ${user.email}...`);
});

// 2. Emit events from route handlers
app.post('/register', async (ctx) => {
  const user = await ctx.body();
  
  // Asynchronously broadcast event to all listeners
  await app.emitEvent('user.registered', user);

  return ctx.status(201).json({ success: true });
});

app.listen(3000);
```

---

## 2. Wildcard Topic Matching

The EventBus supports flexible single-level (`*`) and multi-level (`**`) topic wildcards:

```typescript
// Matches 'order.created', 'order.paid', 'order.shipped'
app.onEvent('order.*', (payload, meta) => {
  console.log(`Order event [${meta.event}]:`, payload);
});

// Matches 'audit.system.auth.failed' and any deep nesting
app.onEvent('audit.**', (payload, meta) => {
  console.log(`Audit log [${meta.event}]:`, payload);
});
```

---

## 3. Async Request-Reply (Microservice RPC)

You can send a message and wait for an asynchronous response over the EventBus with a timeout:

```typescript
// Service A: Worker node handling payments
app.onEvent('payment.process', async (paymentData, meta) => {
  const isApproved = paymentData.amount < 5000;
  
  // Reply back to requester
  app.eventBus.reply(meta, {
    approved: isApproved,
    transactionId: 'txn_' + Date.now()
  });
});

// Service B: API Gateway making the request
app.post('/checkout', async (ctx) => {
  const body = await ctx.body();

  try {
    // Sends request and awaits reply with a 3000ms timeout
    const result = await app.requestEvent('payment.process', body, 3000);
    return ctx.json(result);
  } catch (err) {
    return ctx.status(504).json({ error: 'Payment service timed out' });
  }
});
```

---

## 4. Standalone EventBus & Custom Message Brokers

You can create standalone EventBus instances or plug in external message brokers (such as Redis, NATS, or RabbitMQ):

```typescript
import { createEventBus } from 'velociradix';

const bus = createEventBus({
  transport: {
    async publish(event, payload, metadata) {
      // Example: Publish to Redis Pub/Sub or NATS
      await redisPublisher.publish(event, JSON.stringify({ payload, metadata }));
    }
  }
});
```
