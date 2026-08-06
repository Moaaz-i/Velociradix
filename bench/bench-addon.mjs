// Benchmark: velociradix (C++ engine + JS facade via addon) vs node:http.
// Usage: node bench/bench-addon.mjs  (run `make` first to build the addon)
import net from "net";
import http from "http";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADDON_SERVER = path.join(__dirname, "addon-server.mjs");
const PORT = 9092;
const COMPARE_PORT = 9093;

const REQ = "GET /plain HTTP/1.1\r\nHost: localhost\r\n\r\n";

function connect(port) {
  return new Promise((resolve, reject) => {
    const s = net.connect(port, "127.0.0.1");
    s.once("connect", () => resolve(s));
    s.once("error", reject);
  });
}

async function measure(port, total, k, pipe) {
  // Warmup: fetch one response and record its exact byte length (headers + body).
  // Every response in this benchmark is identical, so we can count responses by
  // dividing received bytes by the fixed response length — O(1) per response.
  const respLen = await new Promise((resolve, reject) => {
    const s = net.connect(port, "127.0.0.1", () => s.write(REQ));
    let buf = "";
    s.on("data", (d) => {
      buf += d;
      const he = buf.indexOf("\r\n\r\n");
      if (he !== -1) {
        const head = buf.slice(0, he);
        const cl = Number(/[Cc]ontent-[Ll]ength:\s*(\d+)/.exec(head)?.[1] ?? 0);
        s.destroy();
        resolve(he + 4 + cl);
      }
    });
    s.on("error", reject);
    setTimeout(() => reject(new Error("warmup timeout")), 5000);
  });

  const perConn = Math.ceil(total / k);
  const start = process.hrtime.bigint();
  let counted = 0;
  let done = 0;

  await new Promise((resolve, reject) => {
    for (let i = 0; i < k; i++) {
      const c = net.connect(port, "127.0.0.1", () => {
        c.write(REQ.repeat(Math.min(pipe, perConn)));
      });
      let sent = Math.min(pipe, perConn);
      let received = 0;
      let partial = Buffer.alloc(0);
      c.on("data", (chunk) => {
        partial = Buffer.concat([partial, chunk]);
        const full = Math.floor(partial.length / respLen);
        if (full > 0) {
          received += full;
          counted += full;
          partial = partial.subarray(full * respLen);
          while (sent < perConn) {
            c.write(REQ);
            sent++;
          }
        }
        if (received >= perConn) c.end();
      });
      c.on("error", reject);
      c.on("close", () => {
        if (++done === k) resolve();
      });
    }
    setTimeout(() => resolve(), 120000);
  });

  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  return { reqs: counted, ms, rps: (counted / ms) * 1000 };
}

function measureNode(port, total, k, pipe) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      res.setHeader("content-type", "text/plain");
      res.end("Hello from velociradix (pure C++ engine)");
    });
    srv.listen(port, "127.0.0.1", async () => {
      try {
        resolve(await measure(port, total, k, pipe));
      } catch (e) {
        resolve({ reqs: 0, ms: 0, rps: 0, error: String(e) });
      } finally {
        srv.close();
      }
    });
  });
}

const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : n.toFixed(0));

async function main() {
  const workers = Number(process.argv[2] ?? 0);
  const proc = spawn(process.execPath, [ADDON_SERVER, String(PORT), String(workers)], { stdio: "ignore" });
  for (let i = 0; i < 100; i++) {
    try {
      const s = await connect(PORT);
      s.destroy();
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (i === 99) throw new Error("addon server did not start");
  }

  const TOTAL = 500000;
  const K = 16;
  const PIPE = 16;

  console.log(`Benchmarking ${TOTAL.toLocaleString()} requests, ${K} connections, pipeline=${PIPE}\n`);
  console.log("--- velociradix (C++ engine + JS facade) ---");
  const v = await measure(PORT, TOTAL, K, PIPE);
  console.log(`  velociradix-addon : ${fmt(v.reqs)} requests in ${v.ms.toFixed(0)}ms  ->  ${fmt(v.rps)} req/s`);
  if (v.error) console.log("  error:", v.error);

  console.log("\n--- node:http (comparison) ---");
  const n = await measureNode(COMPARE_PORT, TOTAL, K, PIPE);
  console.log(`  node:http         : ${fmt(n.reqs)} requests in ${n.ms.toFixed(0)}ms  ->  ${fmt(n.rps)} req/s`);
  if (n.error) console.log("  error:", n.error);

  if (n.rps > 0 && v.rps > 0) {
    console.log(`\nspeedup vs node:http : ${(v.rps / n.rps).toFixed(1)}x`);
  }

  proc.kill();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
