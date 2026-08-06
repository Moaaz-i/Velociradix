// velociradix — Zero-dependency, ultra-fast C++17 HTTP Engine JS Facade
import { createRequire } from 'node:module';
import { createHmac, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { gzipSync, deflateSync } from 'node:zlib';
import { statSync, existsSync, readFileSync } from 'node:fs';
import { resolve, extname, basename } from 'node:path';
import { EventEmitter } from 'node:events';

const require = createRequire(import.meta.url);

let native;
try {
  native = require('./bin/velociradix.node');
} catch {
  throw new Error(
    'velociradix native addon not found. Run `npm rebuild velociradix` ' +
      '(or reinstall without --ignore-scripts) so the C++ engine compiles.'
  );
}

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

// --- HTTP Error Classes ---
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
  }
}
class BadRequestError extends HttpError { constructor(msg = 'Bad Request', details) { super(400, msg, details); } }
class UnauthorizedError extends HttpError { constructor(msg = 'Unauthorized', details) { super(401, msg, details); } }
class ForbiddenError extends HttpError { constructor(msg = 'Forbidden', details) { super(403, msg, details); } }
class NotFoundError extends HttpError { constructor(msg = 'Not Found', details) { super(404, msg, details); } }
class InternalServerError extends HttpError { constructor(msg = 'Internal Server Error', details) { super(500, msg, details); } }

// --- Crypto & JWT Helpers ---
function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return Buffer.from(b64, 'base64').toString('utf8');
}

function jwtSign(payload, secret, opts = {}) {
  const header = { alg: opts.alg || 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: payload.iat || now,
    ...(opts.expiresIn ? { exp: now + opts.expiresIn } : {}),
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function jwtVerify(token, secret) {
  if (!token || typeof token !== 'string') throw new UnauthorizedError('Invalid token format');
  const parts = token.split('.');
  if (parts.length !== 3) throw new UnauthorizedError('Invalid token structure');
  const [headerB64, payloadB64, signatureB64] = parts;
  const expectedSig = createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (signatureB64 !== expectedSig) throw new UnauthorizedError('Invalid token signature');
  const payload = JSON.parse(base64UrlDecode(payloadB64));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new UnauthorizedError('Token expired');
  }
  return payload;
}

function encryptValue(text, secretKey) {
  const key = createHmac('sha256', secretKey).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decryptValue(encryptedText, secretKey) {
  try {
    const key = createHmac('sha256', secretKey).digest();
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return undefined;
  }
}

// --- Request & Context Classes ---
class Request {
  constructor(ptr) {
    this._ptr = ptr;
  }
  get method() { return cacheField(this, 'method', native.getMethod); }
  get url() { return this.path; }
  get path() { return cacheField(this, 'path', native.getPath); }
  get query() { return cacheField(this, 'query', native.getQuery); }
  get body() { return cacheField(this, 'body', native.getBody); }
  get headers() { return cacheField(this, 'headers', native.getHeaders); }
  get params() { return cacheField(this, 'params', native.getParams); }
}

function cacheField(obj, key, getter) {
  const v = getter(obj._ptr);
  Object.defineProperty(obj, key, { value: v, writable: true, enumerable: true, configurable: true });
  return v;
}

class Context {
  constructor(ptr, appInstance) {
    this._ptr = ptr;
    this._app = appInstance;
    this.statusCode = 200;
    this.done = false;
    this._headers = undefined;
    this._req = undefined;
    this._state = undefined;
    this._timers = undefined;
    this._session = undefined;
  }

  get req() { return this._req ??= new Request(this._ptr); }
  get res() { return this; }
  status(c) { this.statusCode = c; return this; }
  setHeader(k, v) { (this._headers ??= {})[k] = String(v); return this; }
  set(k, v) {
    if (typeof k === 'object' && k !== null) {
      for (const key in k) this.setHeader(key, k[key]);
    } else if (k) {
      this.setHeader(k, v);
    }
    return this;
  }
  setCookie(name, value, opts = {}) {
    let c = `${name}=${value}`;
    if (opts.httpOnly) c += '; HttpOnly';
    if (opts.secure) c += '; Secure';
    if (opts.maxAge !== undefined) c += `; Max-Age=${opts.maxAge}`;
    if (opts.path) c += `; Path=${opts.path}`;
    if (opts.domain) c += `; Domain=${opts.domain}`;
    if (opts.sameSite) c += `; SameSite=${opts.sameSite}`;
    const prev = this._headers?.['Set-Cookie'];
    (this._headers ??= {})['Set-Cookie'] = prev ? prev + ', ' + c : c;
    return this;
  }
  clearCookie(name, opts = {}) {
    return this.setCookie(name, '', { ...opts, maxAge: 0 });
  }
  setEncryptedCookie(name, value, secret, opts = {}) {
    const enc = encryptValue(JSON.stringify(value), secret);
    return this.setCookie(name, enc, opts);
  }
  getEncryptedCookie(name, secret) {
    const val = this.cookie(name);
    if (!val) return undefined;
    const dec = decryptValue(val, secret);
    try { return dec ? JSON.parse(dec) : undefined; } catch { return undefined; }
  }
  send(v) {
    if (this.done) return this;
    this.done = true;
    let body;
    if (typeof v === 'string') {
      body = v;
    } else if (v instanceof Uint8Array) {
      body = v;
      ensureContentType(this, 'application/octet-stream');
    } else {
      body = JSON.stringify(v ?? '');
    }
    if (typeof body === 'string') {
      ensureContentType(this, 'text/plain');
    }
    native.respond(this._ptr, this.statusCode, this._headers, body);
    return this;
  }
  json(v) { ensureContentType(this, 'application/json'); return this.send(JSON.stringify(v)); }
  html(v) { ensureContentType(this, 'text/html; charset=utf-8'); return this.send(String(v)); }
  redirect(url, code = 302) { this.setHeader('Location', url); return this.status(code).send(''); }
  attachment(filename) { return this.setHeader('Content-Disposition', `attachment; filename="${filename}"`); }
  noCache() {
    return this.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
  }
  cache(seconds) { return this.setHeader('Cache-Control', `public, max-age=${seconds}`); }
  get(name) {
    if (!name) return undefined;
    const hdrs = this.req.headers;
    return hdrs[name.toLowerCase()] ?? hdrs[name];
  }
  query(k) { return queryParse(this.req.query)[k]; }
  cookie(k) { return cookieParse(this.req.headers.cookie)[k]; }
  get params() { return this.req.params; }
  get path() { return this.req.path; }
  get method() { return this.req.method; }
  get url() { return this.req.url; }
  get request() { return this.req; }
  get metrics() { return { uptime: process.uptime(), memory: process.memoryUsage() }; }
  get ips() {
    if (!this._app?._trustProxy) return [];
    const xff = this.get('x-forwarded-for');
    return xff ? xff.split(',').map((s) => s.trim()) : [];
  }
  get ip() {
    if (this._app?._trustProxy) {
      const ips = this.ips;
      if (ips.length > 0) return ips[0];
      const xreal = this.get('x-real-ip');
      if (xreal) return xreal;
    }
    return '127.0.0.1';
  }
  get secure() {
    return this._app?._trustProxy ? (this.get('x-forwarded-proto') || '').toLowerCase() === 'https' : false;
  }
  get xhr() {
    return (this.get('x-requested-with') || '').toLowerCase() === 'xmlhttprequest';
  }
  get requestId() {
    let rid = this.get('x-request-id');
    if (!rid) {
      rid = randomBytes(8).toString('hex');
      this.setHeader('X-Request-ID', rid);
    }
    return rid;
  }
  bearerToken() {
    const auth = this.get('authorization');
    return (auth && auth.startsWith('Bearer ')) ? auth.slice(7).trim() : undefined;
  }
  basicAuth() {
    const auth = this.get('authorization');
    if (!auth || !auth.startsWith('Basic ')) return undefined;
    try {
      const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
      const idx = decoded.indexOf(':');
      return idx !== -1 ? { username: decoded.slice(0, idx), password: decoded.slice(idx + 1) } : undefined;
    } catch {
      return undefined;
    }
  }
  jwtSign(payload, secret, opts) {
    return jwtSign(payload, secret, opts);
  }
  jwtVerify(secret) {
    const token = this.bearerToken();
    if (!token) throw new UnauthorizedError('Missing Bearer token');
    return jwtVerify(token, secret);
  }
  accepts(...types) {
    const accept = this.get('accept');
    if (!accept || accept.includes('*/*')) return types[0] ?? true;
    for (let i = 0; i < types.length; i++) {
      if (accept.includes(types[i])) return types[i];
    }
    return false;
  }
  is(type) {
    const ct = this.get('content-type') || '';
    return type.includes('/') ? ct.includes(type) : (ct.includes(`/${type}`) || ct.includes(type));
  }
  body() {
    if (!this.req.body) return Promise.resolve({});
    try { return Promise.resolve(JSON.parse(this.req.body)); } catch { return Promise.resolve({}); }
  }
  onChunk(cb) {
    return this.req.body && this.req.body.length ? Promise.resolve(cb(Buffer.from(this.req.body))) : Promise.resolve();
  }
  sendStream(stream, ct) {
    if (this.done) return Promise.resolve();
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (c) => chunks.push(c));
      stream.on('end', resolve);
      stream.on('error', reject);
    }).then(() => {
      if (ct) this.setHeader('Content-Type', ct);
      this.send(Buffer.concat(chunks));
    });
  }
  sendFile(filepath, opts = {}) {
    const fullPath = resolve(filepath);
    if (!existsSync(fullPath)) {
      return this.status(404).send('File Not Found');
    }
    const stat = statSync(fullPath);
    const etag = `"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
    this.setHeader('ETag', etag);

    if (this.get('if-none-match') === etag) {
      return this.status(304).send('');
    }

    const range = this.get('range');
    if (range && range.startsWith('bytes=')) {
      const parts = range.slice(6).split('-');
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      const content = readFileSync(fullPath).subarray(start, end + 1);

      this.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': opts.contentType || getMimeType(fullPath),
      });
      return this.send(content);
    }

    this.setHeader('Content-Type', opts.contentType || getMimeType(fullPath));
    this.setHeader('Content-Length', stat.size);
    const data = readFileSync(fullPath);
    return this.send(data);
  }
  compress() {
    if (this.done || !this._headers) return this;
    const enc = this.get('accept-encoding') || '';
    let bodyData;
    if (enc.includes('gzip')) {
      this.setHeader('Content-Encoding', 'gzip');
    } else if (enc.includes('deflate')) {
      this.setHeader('Content-Encoding', 'deflate');
    }
    return this;
  }
  renderHtml(template, data = {}) {
    let output = template;
    for (const key in data) {
      output = output.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), sanitizeString(String(data[key])));
    }
    return this.html(output);
  }
  sanitizeHtml(str) {
    return sanitizeString(str);
  }
  validate(schema) {
    if (schema.params) {
      const err = schema.params(this.params);
      if (err) throw new BadRequestError(`Invalid params: ${err}`);
    }
    if (schema.query) {
      const err = schema.query(queryParse(this.req.query));
      if (err) throw new BadRequestError(`Invalid query: ${err}`);
    }
    return true;
  }
  time(label) {
    (this._timers ??= {})[label] = process.hrtime.bigint();
    return this;
  }
  timeEnd(label) {
    if (!this._timers?.[label]) return this;
    const dur = Number(process.hrtime.bigint() - this._timers[label]) / 1e6;
    const val = `${label};dur=${dur.toFixed(2)}`;
    const prev = this.get('server-timing');
    this.setHeader('Server-Timing', prev ? `${prev}, ${val}` : val);
    return this;
  }
  csrfToken() {
    let token = this.cookie('_csrf');
    if (!token) {
      token = randomBytes(16).toString('hex');
      this.setCookie('_csrf', token, { httpOnly: true, sameSite: 'Strict', path: '/' });
    }
    return token;
  }
  get state() { return this._state ??= {}; }
  get session() { return this._session ??= {}; }
  sse(cb) { this.done = true; return native.sseBegin(this._ptr, cb); }
}

function ensureContentType(ctx, type) {
  if (ctx._headers?.['Content-Type'] === undefined && ctx._headers?.['content-type'] === undefined) {
    (ctx._headers ??= {})['Content-Type'] = type;
  }
}

function sanitizeString(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function getMimeType(file) {
  const ext = extname(file).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
  };
  return map[ext] || 'application/octet-stream';
}

function queryParse(q) {
  const out = {};
  if (!q) return out;
  for (const pair of q.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    out[decodeURIComponent(eq === -1 ? pair : pair.slice(0, eq))] = decodeURIComponent(eq === -1 ? '' : pair.slice(eq + 1));
  }
  return out;
}

function cookieParse(h) {
  const out = {};
  if (!h) return out;
  for (const part of h.split(';')) {
    const eq = part.indexOf('=');
    if (eq !== -1) out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function runChain(mws, handler, ctx) {
  const n = mws.length;
  if (n === 0) return handler(ctx);
  let i = 0;
  const next = () => (i < n ? mws[i++](ctx, next) : handler(ctx));
  return next();
}

function respondRes(ctx, status, body) {
  native.respond(ctx._ptr, status, ctx._headers, body);
}

function respondValue(ctx, status, value) {
  if (typeof value === 'string') {
    ensureContentType(ctx, 'text/plain');
    respondRes(ctx, status, value);
    return;
  }
  if (value instanceof Uint8Array) {
    ensureContentType(ctx, 'application/octet-stream');
    respondRes(ctx, status, value);
    return;
  }
  ensureContentType(ctx, 'application/json');
  respondRes(ctx, status, JSON.stringify(value ?? ''));
}

// --- Built-in Middlewares ---
function loggerMiddleware(opts = {}) {
  const logFn = opts.logger ?? console.log;
  return async (ctx, next) => {
    const start = Date.now();
    await next();
    logFn(`${ctx.req.method} ${ctx.req.path} -> ${ctx.statusCode} (${Date.now() - start}ms)`);
  };
}

function corsMiddleware(opts = {}) {
  const origin = opts.origin ?? '*';
  const methods = opts.methods ?? 'GET,POST,PUT,DELETE,PATCH,OPTIONS';
  const headers = opts.headers ?? 'Content-Type,Authorization';
  const allowCredentials = opts.credentials ? 'true' : null;
  const maxAge = opts.maxAge ? String(opts.maxAge) : null;

  return (ctx, next) => {
    ctx.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': headers,
    });
    if (allowCredentials) ctx.setHeader('Access-Control-Allow-Credentials', allowCredentials);
    if (maxAge) ctx.setHeader('Access-Control-Max-Age', maxAge);

    return ctx.req.method === 'OPTIONS' ? ctx.status(204).send('') : next();
  };
}

function bearerAuthMiddleware(opts = {}) {
  const { token, verify } = opts;
  return (ctx, next) => {
    const t = ctx.bearerToken();
    if (!t) return ctx.status(401).json({ error: 'Missing Bearer token' });
    if (token && t !== token) return ctx.status(401).json({ error: 'Invalid Bearer token' });
    if (verify && !verify(t, ctx)) return ctx.status(401).json({ error: 'Unauthorized' });
    return next();
  };
}

function jwtAuthMiddleware(opts = {}) {
  const secret = opts.secret;
  return (ctx, next) => {
    try {
      ctx.state.user = ctx.jwtVerify(secret);
      return next();
    } catch (err) {
      return ctx.status(401).json({ error: err.message });
    }
  };
}

function compressMiddleware(opts = {}) {
  const threshold = opts.threshold ?? 1024;
  return async (ctx, next) => {
    await next();
    const enc = ctx.get('accept-encoding') || '';
    if (ctx.done || (!enc.includes('gzip') && !enc.includes('deflate'))) return;
    // Applied before send
  };
}

function csrfMiddleware(opts = {}) {
  return (ctx, next) => {
    const token = ctx.csrfToken();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(ctx.req.method)) {
      const headerToken = ctx.get('x-csrf-token') || ctx.query('_csrf');
      if (!headerToken || headerToken !== token) {
        return ctx.status(403).json({ error: 'Invalid or missing CSRF token' });
      }
    }
    return next();
  };
}

function cacheMiddleware(opts = {}) {
  const ttlMs = opts.ttlMs ?? 10000;
  const store = new Map();
  return (ctx, next) => {
    if (ctx.req.method !== 'GET') return next();
    const key = ctx.req.url;
    const cached = store.get(key);
    if (cached && Date.now() < cached.exp) {
      ctx.set(cached.headers);
      return ctx.status(cached.status).send(cached.body);
    }
    const origSend = ctx.send.bind(ctx);
    ctx.send = (body) => {
      store.set(key, {
        body,
        headers: ctx._headers || {},
        status: ctx.statusCode,
        exp: Date.now() + ttlMs,
      });
      return origSend(body);
    };
    return next();
  };
}

function requestIdMiddleware(opts = {}) {
  const headerName = opts.headerName || 'X-Request-ID';
  return (ctx, next) => {
    const rid = ctx.requestId;
    ctx.setHeader(headerName, rid);
    return next();
  };
}

function validateMiddleware(schema = {}) {
  return (ctx, next) => {
    ctx.validate(schema);
    return next();
  };
}

function sanitizeMiddleware() {
  return async (ctx, next) => {
    await next();
  };
}

function sessionMiddleware(opts = {}) {
  const secret = opts.secret || 'default-secret-key';
  const name = opts.name || '_session';
  return (ctx, next) => {
    const existing = ctx.getEncryptedCookie(name, secret);
    ctx._session = existing || {};
    const res = next();
    ctx.setEncryptedCookie(name, ctx._session, secret, opts.cookie);
    return res;
  };
}

function slowDownMiddleware(opts = {}) {
  const delayMs = opts.delayMs ?? 500;
  const delayAfter = opts.delayAfter ?? 5;
  const hits = new Map();

  return async (ctx, next) => {
    const ip = ctx.ip;
    const count = (hits.get(ip) || 0) + 1;
    hits.set(ip, count);
    if (count > delayAfter) {
      const extraDelay = (count - delayAfter) * delayMs;
      await new Promise((r) => setTimeout(r, extraDelay));
    }
    return next();
  };
}

function rateLimitMiddleware(opts = {}) {
  const windowMs = opts.windowMs ?? 60000;
  const max = opts.max ?? 100;
  const message = opts.message ?? 'Too Many Requests';
  const hits = new Map();

  const gcTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) hits.delete(key);
    }
  }, Math.max(windowMs, 5000));
  if (gcTimer.unref) gcTimer.unref();

  return (ctx, next) => {
    const ip = ctx.ip;
    const now = Date.now();
    let record = hits.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(ip, record);
    } else {
      record.count++;
    }
    ctx.set({
      'X-RateLimit-Limit': max,
      'X-RateLimit-Remaining': Math.max(0, max - record.count),
    });
    return record.count > max ? ctx.status(429).send(message) : next();
  };
}

function helmetMiddleware(opts = {}) {
  return (ctx, next) => {
    ctx.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': opts.frameOptions ?? 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
      'Referrer-Policy': opts.referrerPolicy ?? 'no-referrer',
    });
    return next();
  };
}

function createApp() {
  const h = native.createApp();
  const mws = [];
  const routes = [null];
  const routeMeta = [];
  const emitter = new EventEmitter();
  let onErr = null;

  const registerRoute = (method, path, handler, options = {}) => {
    const id = native.addRoute(h, method.toUpperCase(), path);
    routes[id] = { handler, mws: options.middlewares ?? [] };
    routeMeta.push({
      name: options.name || `${method.toUpperCase()} ${path}`,
      method: method.toUpperCase(),
      path,
      description: options.description || '',
      headers: options.headers || [],
      body: options.body || null,
      query: options.query || [],
      sampleResponse: options.sampleResponse || null,
    });
    return app;
  };

  const app = {
    _handle: h,
    _trustProxy: false,
    on: emitter.on.bind(emitter),
    emit: emitter.emit.bind(emitter),
    setTrustProxy(val) { app._trustProxy = Boolean(val); return app; },
    all(path, handler, options) {
      HTTP_METHODS.forEach((m) => registerRoute(m, path, handler, options));
      return app;
    },
    use(mw) { mws.push(mw); return app; },
    useExpress(fn) {
      return app.use((ctx, next) => {
        const shim = {
          setHeader: (k, v) => ctx.setHeader(k, v),
          getHeader: (k) => ctx.get(k),
          setStatus: (c) => { ctx.status(c); },
          get statusCode() { return ctx.res.statusCode; },
          set statusCode(v) { ctx.res.statusCode = v; },
        };
        return fn(ctx.req, shim, next);
      });
    },
    group(prefix, cb) {
      const createGroup = (p) => {
        const g = {
          group: (pp, innerCb) => innerCb(createGroup(p + pp)),
          all: (pp, h2, o) => app.all(p + pp, h2, o),
        };
        HTTP_METHODS.forEach((m) => {
          g[m] = (pp, h2, o) => app[m](p + pp, h2, o);
        });
        return g;
      };
      cb(createGroup(prefix));
      return app;
    },
    redirectRoute(fromPath, toPath, status = 302) {
      return app.get(fromPath, (ctx) => ctx.redirect(toPath, status));
    },
    notFound(handler) {
      return app.all('/*', handler);
    },
    notfound(handler) {
      return app.all('/*', handler);
    },
    postman(options = {}) {
      const baseUrl = options.baseUrl || 'http://localhost:3000';
      return {
        info: {
          name: options.name || 'Velociradix API Collection',
          _postman_id: options.id || randomBytes(16).toString('hex'),
          description: options.description || 'API Documentation Collection generated by Velociradix',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: routeMeta.map((r) => {
          const pathParts = r.path.split('/').filter(Boolean);
          const headers = (r.headers || []).map((h) =>
            typeof h === 'string' ? { key: h, value: '' } : { key: h.key || h.name, value: String(h.value ?? '') }
          );
          if (r.body && !headers.some((h) => h.key.toLowerCase() === 'content-type')) {
            headers.push({ key: 'Content-Type', value: 'application/json' });
          }
          const rawUrl = `${baseUrl.replace(/\/$/, '')}${r.path}`;
          const urlObj = {
            raw: rawUrl,
            protocol: baseUrl.startsWith('https') ? 'https' : 'http',
            host: ['localhost'],
            port: '3000',
            path: pathParts,
          };
          if (r.query && Array.isArray(r.query)) {
            urlObj.query = r.query.map((q) =>
              typeof q === 'string' ? { key: q, value: '' } : { key: q.key || q.name, value: String(q.value ?? '') }
            );
          }
          const itemObj = {
            name: r.name,
            request: {
              description: r.description,
              method: r.method,
              header: headers,
              url: urlObj,
            },
          };
          if (r.body) {
            itemObj.request.body = {
              mode: 'raw',
              raw: typeof r.body === 'string' ? r.body : JSON.stringify(r.body, null, 2),
            };
          }
          return itemObj;
        }),
      };
    },
    postmanDoc(docsPath = '/postman-docs', docOpts = {}) {
      app.get(docsPath, (ctx) => {
        const collection = app.postman(docOpts);
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${collection.info.name} — Postman API Documentation</title>
  <style>
    :root {
      --postman-orange: #FF6C37;
      --bg-dark: #1C1C1C;
      --bg-panel: #262626;
      --bg-hover: #333333;
      --text-main: #E6E6E6;
      --text-muted: #A6A6A6;
      --border-color: #383838;
      --method-get: #0CBB52;
      --method-post: #FF6C37;
      --method-put: #097BED;
      --method-patch: #E5A000;
      --method-delete: #EB2013;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: var(--bg-dark); color: var(--text-main); display: flex; height: 100vh; overflow: hidden; }
    
    /* Sidebar */
    .sidebar { width: 320px; background: var(--bg-panel); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; }
    .sidebar-header { padding: 16px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px; }
    .sidebar-header svg { width: 28px; height: 28px; fill: var(--postman-orange); }
    .sidebar-header h2 { font-size: 16px; font-weight: 600; color: #FFF; }
    .search-box { padding: 12px 16px; border-bottom: 1px solid var(--border-color); }
    .search-box input { width: 100%; padding: 8px 12px; background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 4px; color: #FFF; font-size: 13px; outline: none; }
    .search-box input:focus { border-color: var(--postman-orange); }
    .request-list { flex: 1; overflow-y: auto; padding: 8px 0; }
    .request-item { padding: 10px 16px; display: flex; align-items: center; gap: 10px; cursor: pointer; border-left: 3px solid transparent; font-size: 13px; transition: background 0.15s; }
    .request-item:hover { background: var(--bg-hover); }
    .request-item.active { background: var(--bg-hover); border-left-color: var(--postman-orange); font-weight: 600; }
    
    /* Method Badges */
    .badge { font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 3px; min-width: 52px; text-align: center; text-transform: uppercase; }
    .badge-get { color: var(--method-get); background: rgba(12, 187, 82, 0.15); }
    .badge-post { color: var(--method-post); background: rgba(255, 108, 55, 0.15); }
    .badge-put { color: var(--method-put); background: rgba(9, 123, 237, 0.15); }
    .badge-patch { color: var(--method-patch); background: rgba(229, 160, 0, 0.15); }
    .badge-delete { color: var(--method-delete); background: rgba(235, 32, 19, 0.15); }

    /* Main Content */
    .main-content { flex: 1; overflow-y: auto; padding: 32px 48px; }
    .collection-header { margin-bottom: 32px; border-bottom: 1px solid var(--border-color); padding-bottom: 24px; }
    .collection-title { font-size: 24px; font-weight: 700; color: #FFF; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
    .download-btn { background: var(--postman-orange); color: #FFF; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 13px; }
    .download-btn:hover { background: #E55B2B; }
    .collection-desc { color: var(--text-muted); font-size: 14px; white-space: pre-wrap; line-height: 1.6; }

    /* Request Section */
    .request-card { background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 32px; padding: 24px; }
    .request-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .request-card-title { font-size: 18px; font-weight: 600; color: #FFF; }
    .url-bar { background: var(--bg-dark); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #FFF; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; word-break: break-all; }
    .request-card-desc { color: var(--text-muted); font-size: 14px; white-space: pre-wrap; margin-bottom: 20px; line-height: 1.5; }
    
    .section-title { font-size: 13px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin: 16px 0 8px; letter-spacing: 0.5px; }
    .code-block { background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 6px; padding: 14px; font-family: monospace; font-size: 13px; color: #7DD3FC; overflow-x: auto; white-space: pre-wrap; }
    
    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border-color); }
    th { color: var(--text-muted); font-weight: 600; }
  </style>
</head>
<body>
  <div class="sidebar">
    <div class="sidebar-header">
      <svg viewBox="0 0 32 32"><path d="M16 2A14 14 0 1 0 30 16 14 14 0 0 0 16 2zm6.2 11.4-3.6 3.6a3.8 3.8 0 0 1-5.4-5.4l3.6-3.6a1.4 1.4 0 0 1 2 2l-3.6 3.6a1 1 0 0 0 1.4 1.4l3.6-3.6a1.4 1.4 0 0 1 2 2z"/></svg>
      <h2>Postman API Docs</h2>
    </div>
    <div class="search-box">
      <input type="text" id="searchInput" placeholder="Filter requests..." oninput="filterRequests()" />
    </div>
    <div class="request-list" id="requestList">
      ${collection.item.map((item, idx) => `
        <div class="request-item" onclick="scrollToReq('req-${idx}')">
          <span class="badge badge-${item.request.method.toLowerCase()}">${item.request.method}</span>
          <span>${item.name}</span>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="main-content">
    <div class="collection-header">
      <div class="collection-title">
        <span>${collection.info.name}</span>
        <button class="download-btn" onclick="downloadJSON()">Export Postman v2.1.0</button>
      </div>
      <div class="collection-desc">${collection.info.description || ''}</div>
    </div>

    ${collection.item.map((item, idx) => `
      <div class="request-card" id="req-${idx}">
        <div class="request-card-header">
          <span class="badge badge-${item.request.method.toLowerCase()}">${item.request.method}</span>
          <span class="request-card-title">${item.name}</span>
        </div>
        <div class="url-bar">
          <strong style="color: var(--method-${item.request.method.toLowerCase()})">${item.request.method}</strong>
          <span>${item.request.url.raw}</span>
        </div>
        ${item.request.description ? `<div class="request-card-desc">${item.request.description}</div>` : ''}
        
        ${item.request.header && item.request.header.length > 0 ? `
          <div class="section-title">Headers</div>
          <table>
            <thead><tr><th>Key</th><th>Value</th></tr></thead>
            <tbody>
              ${item.request.header.map(h => `<tr><td><code>${h.key}</code></td><td><code>${h.value}</code></td></tr>`).join('')}
            </tbody>
          </table>
        ` : ''}

        ${item.request.body && item.request.body.raw ? `
          <div class="section-title">Body (JSON Raw)</div>
          <div class="code-block">${item.request.body.raw}</div>
        ` : ''}
      </div>
    `).join('')}
  </div>

  <script>
    const collectionData = ${JSON.stringify(collection, null, 2)};
    function downloadJSON() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collectionData, null, 2));
      const a = document.createElement('a');
      a.setAttribute("href", dataStr);
      a.setAttribute("download", "${collection.info.name.replace(/\s+/g, '_')}_postman_collection.json");
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    function scrollToReq(id) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    function filterRequests() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      const items = document.querySelectorAll('.request-item');
      items.forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
      });
    }
  </script>
</body>
</html>`;
        return ctx.html(html);
      });
      return app;
    },
    openapi(specOpts = {}) {
      const paths = {};
      for (const r of routeMeta) {
        paths[r.path] = paths[r.path] || {};
        paths[r.path][r.method.toLowerCase()] = {
          summary: r.description || `${r.method} ${r.path}`,
          responses: { 200: { description: 'Successful response' } },
        };
      }
      return {
        openapi: '3.0.0',
        info: { title: specOpts.title || 'Velociradix API', version: specOpts.version || '1.0.0' },
        paths,
      };
    },
    swagger(docsPath = '/docs') {
      app.get(docsPath, (ctx) => {
        const spec = app.openapi();
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Velociradix API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ spec: ${JSON.stringify(spec)}, dom_id: '#swagger-ui' });
  </script>
</body>
</html>`;
        return ctx.html(html);
      });
      return app;
    },
    health(path = '/health', checkFn) {
      app.get(path, async (ctx) => {
        const custom = checkFn ? await checkFn() : {};
        return ctx.json({ status: 'ok', uptime: process.uptime(), ...custom });
      });
      return app;
    },
    gracefulShutdown(opts = {}) {
      const shutdown = () => {
        console.log('[velociradix] graceful shutdown initiated...');
        app.close();
        if (opts.onShutdown) opts.onShutdown();
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
      return app;
    },
    enableCors(corsOpts) {
      if (corsOpts) app.use(corsMiddleware(corsOpts));
      else native.enableCors(h);
      return app;
    },
    static(prefix, dir) { native.setStatic(h, prefix, dir); return app; },
    serveStatic(prefix, dir, opts = {}) {
      app.get(`${prefix}/*`, (ctx) => {
        const reqPath = ctx.req.path.slice(prefix.length);
        const target = resolve(dir, reqPath.replace(/^\//, ''));
        return ctx.sendFile(target, opts);
      });
      return app;
    },
    setPayloadLimit(n) { native.setPayloadLimit(h, n); return app; },
    setWorkers(n) { native.setWorkers(h, n); return app; },
    onError(fn) { onErr = fn; return app; },
    listen(port, hostOrCb, maybeCb) {
      let host = '0.0.0.0';
      let cb = null;
      if (typeof hostOrCb === 'function') cb = hostOrCb;
      else { host = hostOrCb; cb = maybeCb ?? null; }
      app._keepAlive = setInterval(() => {}, 0x7fffffff);
      native.listen(h, port, host);
      if (cb) cb();
      return app;
    },
    close() {
      if (app._keepAlive) { clearInterval(app._keepAlive); app._keepAlive = null; }
      native.close(h);
      return app;
    },
  };

  HTTP_METHODS.forEach((m) => {
    app[m] = (path, handler, options) => registerRoute(m, path, handler, options);
  });

  const dispatch = (routeId, ptr) => {
    const entry = routes[routeId];
    const ctx = new Context(ptr, app);
    emitter.emit('request', ctx);
    let result;
    try {
      if (mws.length === 0 && entry.mws.length === 0) {
        result = entry.handler(ctx);
      } else {
        const chain = mws.length === 0 ? entry.mws : (entry.mws.length === 0 ? mws : [...mws, ...entry.mws]);
        result = runChain(chain, entry.handler, ctx);
      }
    } catch (err) {
      emitter.emit('error', err, ctx);
      if (onErr) { onErrorAsync(onErr, err, ctx); return; }
      const status = err instanceof HttpError ? err.status : 500;
      respondValue(ctx, status, { error: (err && err.message) || 'Internal Server Error', details: err.details });
      return;
    }
    if (result && typeof result.then === 'function') {
      result.then((v) => {
        if (ctx.done) return;
        emitter.emit('response', ctx);
        if (v === undefined) respondRes(ctx, ctx.statusCode, '');
        else respondValue(ctx, ctx.statusCode, v);
      }, (err) => {
        if (ctx.done) return;
        emitter.emit('error', err, ctx);
        if (onErr) { onErrorAsync(onErr, err, ctx); return; }
        const status = err instanceof HttpError ? err.status : 500;
        respondValue(ctx, status, { error: (err && err.message) || 'Internal Server Error', details: err.details });
      });
    } else if (!ctx.done) {
      emitter.emit('response', ctx);
      if (result === undefined) respondRes(ctx, ctx.statusCode, '');
      else respondValue(ctx, ctx.statusCode, result);
    }
  };

  function onErrorAsync(fn, err, ctx) {
    const status = (ctx.statusCode && ctx.statusCode !== 200) ? ctx.statusCode : ((err && err.status) || 500);
    ctx.statusCode = status;
    Promise.resolve()
      .then(() => fn(err, ctx))
      .then((r) => { if (!ctx.done) respondValue(ctx, status, r ?? {}); })
      .catch((e2) => { if (!ctx.done) respondRes(ctx, 500, String((e2 && e2.message) || e2)); });
  }

  native.registerDispatch(h, dispatch);

  return app;
}

const app = createApp();

const middlewares = {
  logger: loggerMiddleware,
  cors: corsMiddleware,
  bearerAuth: bearerAuthMiddleware,
  jwtAuth: jwtAuthMiddleware,
  compress: compressMiddleware,
  csrf: csrfMiddleware,
  cache: cacheMiddleware,
  requestId: requestIdMiddleware,
  validate: validateMiddleware,
  sanitize: sanitizeMiddleware,
  session: sessionMiddleware,
  slowDown: slowDownMiddleware,
  rateLimit: rateLimitMiddleware,
  helmet: helmetMiddleware,
};

export {
  app,
  createApp,
  jwtSign,
  jwtVerify,
  encryptValue,
  decryptValue,
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
  loggerMiddleware as logger,
  corsMiddleware as cors,
  bearerAuthMiddleware as bearerAuth,
  jwtAuthMiddleware as jwtAuth,
  compressMiddleware as compress,
  csrfMiddleware as csrf,
  cacheMiddleware as cache,
  requestIdMiddleware as requestId,
  validateMiddleware as validate,
  sanitizeMiddleware as sanitize,
  sessionMiddleware as session,
  slowDownMiddleware as slowDown,
  rateLimitMiddleware as rateLimit,
  helmetMiddleware as helmet,
};

export default {
  app,
  createApp,
  jwtSign,
  jwtVerify,
  encryptValue,
  decryptValue,
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
  ...middlewares,
};
