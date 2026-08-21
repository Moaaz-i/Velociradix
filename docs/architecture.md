# C++ Engine Architecture & Multi-Threading

Velociradix is built around a hybrid **Multi-Threaded Native C++17 Engine** coupled with a single-threaded V8 JavaScript execution layer.

---

## 🧵 1. Multi-Threading & Socket Load Balancing (`SO_REUSEPORT`)

Standard Node.js applications run on a single main thread, which limits network socket processing to a single CPU core unless complex `cluster` modules are configured.

Velociradix solves this natively at the kernel level:

```text
 ┌───────────────────────────────────────────────────────────┐
 │               OS Network Sockets & TCP Kernel             │
 └─────────────────────────────┬─────────────────────────────┘
                               │ SO_REUSEPORT Kernel Load-Balancing
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
 ┌──────▼─────────────┐ ┌──────▼─────────────┐ ┌──────▼─────────────┐
 │ C++ Worker Thread 1│ │ C++ Worker Thread 2│ │ C++ Worker Thread N│
 │   (kqueue/epoll)   │ │   (kqueue/epoll)   │ │   (kqueue/epoll)   │
 └──────────┬─────────┘ └──────────┬─────────┘ └──────────┬─────────┘
            │                      │                      │
            └──────────────────────┼──────────────────────┘
                                   │ Lock-Free N-API Queue
                        ┌──────────▼──────────┐
                        │   V8 Main Thread    │
                        │ (JS Middleware/App) │
                        └─────────────────────┘
```

### Key Multi-Threading Principles:

1. **Kernel-Level Distribution (`SO_REUSEPORT`)**:
   Velociradix configures underlying TCP sockets with `SO_REUSEPORT`. The OS kernel automatically load-balances incoming TCP connections across multiple C++ worker threads running on dedicated CPU cores.

2. **Off-Main-Thread Processing**:
   - Socket I/O operations, HTTP header parsing, and static route matching run 100% inside native C++ worker threads.
   - Up to **80% of request execution overhead** is offloaded from the Node.js main thread.

3. **C++ Fast-Path Threads**:
   For routes registered with `app.fastGet()` or `app.fastPost()`, response bytes are written directly back to network sockets from C++ background threads **without ever waking up the V8 JavaScript thread**, reaching **120,000+ req/s**.

### 🛠️ Setting Thread Count in JavaScript:

You can specify the number of C++ worker threads directly using `app.setWorkers(count)`:

```js
import os from 'node:os';
import { createApp } from 'velociradix';

const app = createApp();

// Set worker threads to match available CPU cores
app.setWorkers(os.cpus().length);

app.listen(3000);
```

---

## ⚡ 2. Lock-Free Native Object Pooling & V8 Monomorphic Shapes

To maintain low latency and eliminate Garbage Collection (GC) pauses:

- **Thread-Local Free-Lists**: C++ `PendingCall` memory blocks are pooled in thread-local storage without expensive mutex locks.
- **V8 Monomorphic Context Pool**: JavaScript `Context` objects are pre-allocated and recycled. Object hidden classes (shapes) remain strictly monomorphic, preventing V8 de-optimizations.

---

## 📊 3. Event Loop Comparison

| Mechanism | Standard Node.js (`http`) | Velociradix Engine |
| :--- | :--- | :--- |
| **Socket Handling** | Single Thread (libuv) | Multi-Threaded C++ Workers (`kqueue`/`epoll`) |
| **Header Parsing** | llhttp on JS thread | Zero-copy `string_view` on C++ worker thread |
| **Route Matching** | JS String comparisons | Zero-allocation C++ Radix Trie |
| **Fast-Path Support** | ❌ None | ✅ Direct C++ socket write (120,000+ req/s) |
| **GC Overhead** | High (creates new objects per req) | Zero (recycled monomorphic Context pool) |

---

## 🛡️ 4. Parser Hardening & Socket Tuning

The C++ HTTP parser runs on worker threads before any JavaScript handler:

- Rejects request smuggling (`Content-Length` conflicts, `Transfer-Encoding` + `Content-Length`, obs-fold, LF-only framing).
- Requires `Host` on HTTP/1.1; rejects `TRACE`/`CONNECT`; caps header block (32 KiB / 100 headers) and URI length (8 KiB).
- Closes Slowloris connections after 10s of incomplete headers; max 16,384 connections per worker.
- Strips CR/LF/NUL from outbound header names and values.
- Accepted sockets use `TCP_NODELAY` (Linux also `accept4` + `TCP_QUICKACK`) so small responses flush without Nagle delay.
- Peer IPv4 is captured at `accept()` and exposed as `ctx.req.remoteAddress`.

