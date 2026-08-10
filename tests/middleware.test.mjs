import assert from "node:assert/strict";
import {
  createApp,
  logger,
  slowDown,
  cache,
  sanitize,
  validate,
  BadRequestError,
} from "../index.mjs";

console.log("=== Running Comprehensive Middleware & Feature Tests ===");

async function runTests() {
  let logs = [];
  const testLogger = (msg) => logs.push(msg);

  const testApp = createApp();

  // Test 1: logger error bypass
  testApp.use(logger({ logger: testLogger }));

  // Test 5: sanitize middleware
  testApp.use(sanitize());

  testApp.get("/normal", (ctx) => ctx.send("ok"));

  testApp.get("/error-route", (ctx) => {
    ctx.status(500);
    throw new Error("KABOOM_TEST");
  });

  // Test 4 & 6: ctx.validate body schema + Zod / Schema first class support
  testApp.post("/validate-fn-body", (ctx) => {
    ctx.validate({
      body: (b) => (!b.name ? "name is required" : undefined),
    });
    return { ok: true };
  });

  // Native Zod-like object mock
  const zodSchemaMock = {
    safeParse: (data) => {
      if (!data || typeof data.age !== "number") {
        return {
          success: false,
          error: {
            issues: [{ path: ["age"], message: "Expected number, received NaN" }],
          },
        };
      }
      return { success: true, data };
    },
  };

  testApp.post("/validate-zod-body", (ctx) => {
    ctx.validate(zodSchemaMock);
    return { ok: true, age: ctx.req.body };
  });

  testApp.get("/sanitize-params/:param", (ctx) => {
    return ctx.json({ param: ctx.params.param, query: ctx.query("q") });
  });

  testApp.get("/cache-test", (ctx) => ctx.send(`time-${Date.now()}`), {
    middlewares: [cache({ ttlMs: 200 })],
  });

  testApp.get("/slowdown-test", (ctx) => "slow", {
    middlewares: [slowDown({ delayAfter: 2, delayMs: 100, windowMs: 1000 })],
  });

  const server = testApp.listen(9876);
  const base = "http://127.0.0.1:9876";

  try {
    // 1. Logger Middleware Test (Uncaught Error Logging)
    console.log("Testing 1. logger error-bypass...");
    const errRes = await fetch(`${base}/error-route`);
    assert.equal(errRes.status, 500);
    assert.ok(logs.some((l) => l.includes("/error-route -> 500")));
    console.log("  ✓ logger error-bypass verified");

    // 2. slowDownMiddleware GC & delay test
    console.log("Testing 2. slowDownMiddleware hit count...");
    const t0 = Date.now();
    await fetch(`${base}/slowdown-test`);
    await fetch(`${base}/slowdown-test`);
    await fetch(`${base}/slowdown-test`); // Should delay ~100ms
    const duration = Date.now() - t0;
    assert.ok(duration >= 90, `Expected delay >= 90ms, got ${duration}ms`);
    console.log("  ✓ slowDownMiddleware verified");

    // 3. cacheMiddleware TTL Eviction test
    console.log("Testing 3. cacheMiddleware TTL Eviction...");
    const c1 = await (await fetch(`${base}/cache-test`)).text();
    const c2 = await (await fetch(`${base}/cache-test`)).text();
    assert.equal(c1, c2);
    await new Promise((r) => setTimeout(r, 250)); // Wait for TTL expiry
    const c3 = await (await fetch(`${base}/cache-test`)).text();
    assert.notEqual(c1, c3);
    console.log("  ✓ cacheMiddleware TTL eviction verified");

    // 4. ctx.validate body schema execution
    console.log("Testing 4. ctx.validate body schema execution...");
    const vBad = await fetch(`${base}/validate-fn-body`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age: 25 }),
    });
    assert.equal(vBad.status, 400);
    const vBadData = await vBad.json();
    assert.ok(vBadData.error.includes("Invalid body: name is required"));

    const vGood = await fetch(`${base}/validate-fn-body`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "moaaz" }),
    });
    assert.equal(vGood.status, 200);
    console.log("  ✓ ctx.validate body schema verified");

    // 5. sanitizeMiddleware implementation
    console.log("Testing 5. sanitizeMiddleware input sanitization...");
    const sRes = await fetch(`${base}/sanitize-params/${encodeURIComponent("<script>alert(1)</script>")}?q=${encodeURIComponent("<img src=x onerror=alert(1)>")}`);
    const sData = await sRes.json();
    assert.equal(sData.param, "&lt;script&gt;alert(1)&lt;/script&gt;");
    assert.equal(sData.query, "&lt;img src=x onerror=alert(1)&gt;");
    console.log("  ✓ sanitizeMiddleware input sanitization verified");

    // 6. Native Zod / Schema First-Class Integration
    console.log("Testing 6. Zod/Schema First-Class Integration...");
    const zBad = await fetch(`${base}/validate-zod-body`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age: "invalid" }),
    });
    assert.equal(zBad.status, 400);
    const zBadData = await zBad.json();
    assert.ok(zBadData.error.includes("age: Expected number, received NaN"));

    const zGood = await fetch(`${base}/validate-zod-body`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age: 30 }),
    });
    assert.equal(zGood.status, 200);
    console.log("  ✓ Zod / Schema First-Class integration verified");

    console.log("\nALL COMPREHENSIVE TESTS PASSED SUCCESSFULLY! 🎉");
  } finally {
    testApp.close();
  }
}

runTests().catch((e) => {
  console.error("Test Suite Failed:", e);
  process.exit(1);
});
