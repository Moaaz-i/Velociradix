# Clustering, Worker Scaling & Low-Resource Optimization

Velociradix is engineered to maximize performance across everything from high-core enterprise servers (64+ vCPUs) to low-end single-core VPS instances (1 vCPU, 512MB RAM, or Raspberry Pi).

---

## 🖥️ 1. Multi-Core Process Clustering (`app.cluster`)

While Velociradix automatically runs multi-threaded C++ workers for socket I/O, you can also scale JavaScript V8 isolates across all CPU cores using the built-in `cluster()` helper:

```javascript
import { app } from 'velociradix';

// Automatically forks a worker per available CPU core
app.cluster({
  workers: 4,      // Number of worker processes (default: os.cpus().length)
  respawn: true    // Automatically restart worker if it exits unexpectedly
}, () => {
  // Application code executed inside each cluster worker
  app.get('/api/data', (ctx) => {
    return ctx.json({ pid: process.pid, time: Date.now() });
  });

  app.listen(3000, () => {
    console.log(`Worker process ${process.pid} listening on :3000`);
  });
});
```

---

## ⚡ 2. Dynamic Auto-Scaling (`app.autoScale`)

Adjust C++ worker threads dynamically based on real-time memory and CPU consumption:

```javascript
import { app } from 'velociradix';

app
  .autoScale({
    minWorkers: 2,
    maxWorkers: 8,
    intervalMs: 5000
  })
  .get('/', (ctx) => ctx.send('Auto-scaling enabled'))
  .listen(3000);
```

---

## 🍃 3. Running on Low-End Hardware (1 vCPU / 512MB RAM)

When deploying to budget servers (e.g. Free Tier VMs, Raspberry Pi, AWS t4g.nano, Fly.io):

### Best Practices for Low-Spec Environments:
1. **Set C++ Workers to 1:** Prevents thread context switching overhead on single-core CPUs:
   ```javascript
   app.setWorkers(1);
   ```
2. **Cap Request Body Size:** Protects against Out-Of-Memory (OOM) memory exhaustion:
   ```javascript
   app.setPayloadLimit(2 * 1024 * 1024); // 2MB max payload
   ```
3. **Use Fast C++ Routes (`app.fastGet`) for Health & Status:**
   ```javascript
   app.fastGet('/health', { status: 'healthy' });
   ```
4. **Benefit from Zero-Dependency Architecture:**
   Velociradix has zero external npm dependencies and starts in **< 10ms** with an idle memory footprint of **under 20MB RAM**.

```javascript
import { app } from 'velociradix';

app
  .setWorkers(1)
  .setPayloadLimit(2 * 1024 * 1024)
  .fastGet('/health', { status: 'ok' })
  .get('/', (ctx) => ctx.json({ message: 'Velociradix on low-spec hardware' }))
  .listen(3000);
```
