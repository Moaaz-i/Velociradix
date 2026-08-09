# 📖 Velociradix Architecture & Technical Documentation

Velociradix is a **zero-dependency, ultra-fast C++17 HTTP engine and Node.js web framework**. It is designed from the ground up for maximum throughput, sub-millisecond response latency, and low memory footprints under extreme concurrency.

---

## 🏛️ Core Architecture Overview

Velociradix achieves its world-class performance through a **hybrid C++ / Node.js off-main-thread architecture**:

```
 ┌─────────────────────────────────────────────────────────┐
 │               OS Network Sockets & TCP Kernel           │
 └────────────────────────────┬────────────────────────────┘
                              │ SO_REUSEPORT Multi-Thread
 ┌────────────────────────────▼────────────────────────────┐
 │               Native C++ Worker Event Loops             │
 │          (kqueue on macOS / epoll on Linux)             │
 ├─────────────────────────────────────────────────────────┤
 │ 1. Zero-Copy Request Parsing (parse_request)            │
 │ 2. Trie-Based Radix Router (match_route)                │
 │ 3. Off-Thread Socket I/O & Pre-built Fast-Path Cache    │
 └────────────────────────────┬────────────────────────────┘
                              │ Non-blocking N-API Dispatch
 ┌────────────────────────────▼────────────────────────────┐
 │               Node.js V8 JavaScript Thread              │
 │          (Context & Request Monomorphic Pools)          │
 ├─────────────────────────────────────────────────────────┤
 │ 1. Express / Koa / Custom Middleware Execution          │
 │ 2. Application Route Handlers (Async / Sync)             │
 └─────────────────────────────────────────────────────────┘
```

---

## ⚡ Performance Mechanisms

### 1. Off-Main-Thread Processing
80% of typical web framework workload—including socket listening, HTTP pipelining, request header parsing, and static route matching—is executed entirely in native C++ worker threads. The Node.js V8 thread is only invoked when JavaScript application logic needs to execute.

### 2. Zero-Copy Memory & Custom String View Parsing
Request URLs, headers, and query parameters are parsed using C++ `std::string_view` pointers into the socket receive buffer. No unnecessary dynamic memory allocations occur during request ingestion.

### 3. Native Object Pooling
Both C++ `PendingCall` structures and JavaScript `Context` / `Request` wrappers are pooled in thread-local lock-free freelists. Memory is recycled between requests, completely eliminating V8 Garbage Collection (GC) pauses under heavy load.

### 4. C++ Fast-Path Caching (`fastGet`, `fastPost`, `fastRoute`)
For static or pre-formatted responses, Velociradix serves response bytes directly from native C++ memory using cached `Date` and HTTP headers—bypassing Node.js V8 execution completely for **120,000+ req/s**.

---

## 🔒 Security & Supply Chain Integrity

- **Zero Runtime Dependencies**: 0 third-party runtime npm packages. Uses Node.js native standard libraries only.
- **OIDC Provenance**: Built and published via GitHub Actions Trusted Publishers with cryptographic Sigstore attestations.
- **Built-in Security Middleware**: Native `helmet()`, `cors()`, `rateLimit()`, `slowDown()`, `csrf()`, and encrypted cookie storage using AES-256-CBC.
