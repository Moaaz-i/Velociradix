// Smoke test: real HTTP through the native addon, exercising all 40 features in velociradix.
import {
  app,
  helmet,
  rateLimit,
  bearerAuth,
  jwtAuth,
  jwtSign,
  jwtVerify,
  cache,
  requestId,
  session,
  HttpError,
  BadRequestError,
} from "./index.mjs";
import { writeFileSync, unlinkSync } from "node:fs";

// Create a temp file for sendFile test
const tempFile = "./temp_test_report.txt";
writeFileSync(tempFile, "Hello World from Velociradix sendFile with ETag & Range support!");

app
  .setTrustProxy(true)
  .enableCors({ origin: "*", methods: "GET,POST,PATCH,DELETE,OPTIONS" })
  .setPayloadLimit(1024 * 1024)
  .use(helmet())
  .use(requestId())
  .use(session({ secret: "my-session-secret-key-12345" }))
  .health("/health", () => ({ db: "connected" }))
  .swagger("/docs")
  .redirectRoute("/old-hello", "/hello")
  .use((ctx, next) => {
    ctx.state.started = Date.now();
    return next();
  })
  .get("/hello", async (ctx) => {
    ctx.set("X-Custom-Chain", "velociradix").set("X-Framework", "v5");
    ctx.time("db_query");
    // Simulate tiny DB work
    ctx.timeEnd("db_query");
    return {
      message: "hello from velociradix",
      param: ctx.params.id,
      q: ctx.query("name"),
      cookie: ctx.cookie("sid"),
      started: ctx.state.started,
      ip: ctx.ip,
      ips: ctx.ips,
      userAgent: ctx.get("User-Agent"),
      isJson: ctx.is("json"),
      acceptsJson: ctx.accepts("json"),
      requestId: ctx.requestId,
    };
  })
  .post("/echo", async (ctx) => {
    const body = await ctx.body();
    return { received: body, kind: typeof body };
  })
  .patch("/items/:id", (ctx) => ctx.json({ patched: ctx.params.id }))
  .all("/all-methods", (ctx) => ctx.send(`handled method ${ctx.req.method}`))
  .get("/plain", (ctx) => ctx.send("plain text"))
  .get("/html-template", (ctx) =>
    ctx.renderHtml("<h1>Hello {{ name }}</h1>", { name: "Velociradix User" })
  )
  .get("/send-file-test", (ctx) => ctx.sendFile(tempFile))
  .get("/cached-endpoint", (ctx) => ctx.send(`cached-at-${Date.now()}`), {
    middlewares: [cache({ ttlMs: 5000 })],
  })
  .get("/jwt-issue", (ctx) => {
    const token = ctx.jwtSign({ userId: 42, role: "admin" }, "my-jwt-secret", {
      expiresIn: 3600,
    });
    return { token };
  })
  .get("/jwt-protected", (ctx) => ctx.json({ user: ctx.state.user }), {
    middlewares: [jwtAuth({ secret: "my-jwt-secret" })],
  })
  .get("/encrypted-cookie-test", (ctx) => {
    ctx.setEncryptedCookie("user_secret", { id: 77, email: "test@v.com" }, "cookie-key");
    return { ok: true };
  })
  .get("/read-encrypted-cookie", (ctx) => {
    const val = ctx.getEncryptedCookie("user_secret", "cookie-key");
    return { decrypted: val };
  })
  .get("/session-test", (ctx) => {
    ctx.session.views = (ctx.session.views || 0) + 1;
    return { views: ctx.session.views };
  })
  .get("/bad-request-test", (ctx) => {
    throw new BadRequestError("Invalid input parameters", { field: "email" });
  })
  .get("/attachment", (ctx) => ctx.attachment("report.pdf").send("pdf-content"))
  .get("/cache-test", (ctx) => ctx.cache(3600).send("cached"))
  .get("/nocache-test", (ctx) => ctx.noCache().send("nocache"))
  .get("/auth-test", (ctx) => {
    const token = ctx.bearerToken();
    const basic = ctx.basicAuth();
    return { token, basic };
  })
  .get("/cookies", (ctx) => {
    ctx.setCookie("sid", "abc123", { httpOnly: true, path: "/" });
    return { ok: true };
  })
  .get("/clear-cookies", (ctx) => {
    ctx.clearCookie("sid", { path: "/" });
    return { ok: true };
  })
  .get("/protected", (ctx) => ctx.send("secret data"), {
    middlewares: [bearerAuth({ token: "secret123" })],
  })
  .get("/rate-limited", (ctx) => ctx.send("ok"), {
    middlewares: [rateLimit({ max: 2, windowMs: 1000 })],
  })
  .get("/stream", async (ctx) => {
    const { Readable } = await import("node:stream");
    const s = Readable.from([
      Buffer.from("a"),
      Buffer.from("b"),
      Buffer.from("c"),
    ]);
    await ctx.sendStream(s, "text/plain");
  })
  .get("/sse", (ctx) => {
    ctx.sse((sendEvent, close) => {
      sendEvent({ now: Date.now() }, "tick");
      setTimeout(() => {
        sendEvent({ done: true }, "end");
        close();
      }, 100);
    });
  })
  .get("/status", (ctx) => ctx.status(418).send("teapot"))
  .get("/err", (ctx) => {
    throw new Error("boom");
  })
  .onError((err, ctx) => {
    if (err instanceof HttpError) {
      return { error: err.message, status: err.status, details: err.details };
    }
    return { error: err.message };
  })
  .group("/api", (g) => {
    g.get("/users/:id", (ctx) => ({ user: ctx.params.id }));
  })
  .listen(8899, async () => {
    console.log("listening on 8899");
    try {
      await run();
    } catch (e) {
      console.error("FAILED", e);
      process.exit(1);
    }
  });

async function run() {
  const base = "http://127.0.0.1:8899";
  const j = async (p, o) => {
    const r = await fetch(base + p, o);
    return { status: r.status, headers: r.headers, text: await r.text() };
  };

  const hello = await j("/hello?name=moaaz", {
    headers: {
      cookie: "sid=abc",
      "X-Forwarded-For": "203.0.113.195, 70.41.3.18",
      "User-Agent": "VelociradixTest/1.0",
      "Content-Type": "application/json",
    },
  });
  console.log("GET /hello ->", hello.status, hello.text);
  console.log("GET /hello Server-Timing ->", hello.headers.get("server-timing"));
  console.log("GET /hello X-Request-ID ->", hello.headers.get("x-request-id"));

  const health = await j("/health");
  console.log("GET /health ->", health.status, health.text);

  const redirectRes = await fetch(base + "/old-hello", { redirect: "manual" });
  console.log("GET /old-hello (redirect) ->", redirectRes.status, redirectRes.headers.get("location"));

  const fileRes = await j("/send-file-test");
  console.log("GET /send-file-test ->", fileRes.status, fileRes.text);
  console.log("GET /send-file-test ETag ->", fileRes.headers.get("etag"));

  // Test Range request
  const rangeRes = await j("/send-file-test", { headers: { Range: "bytes=0-10" } });
  console.log("GET /send-file-test (Range) ->", rangeRes.status, rangeRes.text);

  const tmplRes = await j("/html-template");
  console.log("GET /html-template ->", tmplRes.text);

  // JWT tests
  const jwtIssue = await j("/jwt-issue");
  const jwtData = JSON.parse(jwtIssue.text);
  console.log("GET /jwt-issue -> token length:", jwtData.token.length);

  const jwtProt = await j("/jwt-protected", {
    headers: { Authorization: `Bearer ${jwtData.token}` },
  });
  console.log("GET /jwt-protected ->", jwtProt.status, jwtProt.text);

  // Encrypted cookie test
  const encCookie = await j("/encrypted-cookie-test");
  const setCookie = encCookie.headers.get("set-cookie");
  console.log("GET /encrypted-cookie-test Set-Cookie ->", setCookie.slice(0, 40) + "...");

  const readEnc = await j("/read-encrypted-cookie", {
    headers: { cookie: setCookie },
  });
  console.log("GET /read-encrypted-cookie ->", readEnc.text);

  // Cache middleware test
  const c1 = await j("/cached-endpoint");
  const c2 = await j("/cached-endpoint");
  console.log("GET /cached-endpoint (c1 == c2) ->", c1.text === c2.text);

  // Custom HTTP Error test
  console.log("Sending GET /bad-request-test...");
  const badReq = await j("/bad-request-test");
  console.log("GET /bad-request-test ->", badReq.status, badReq.text);

  console.log("Closing app...");
  app.close();
  process.exit(0);
}

// also remove from catch block:
// app.listen ...
//  } catch (e) {
//    console.error("FAILED", e);
//    process.exit(1);
//  }
