import type { Readable } from 'node:stream';

/** Primitive JSON-compatible data types */
export type JsonPrimitive = string | number | boolean | null | undefined;
/** JSON object map */
export type JsonObject = { [key: string]: JsonPrimitive | JsonObject | JsonArray };
/** JSON array list */
export type JsonArray = Array<JsonPrimitive | JsonObject | JsonArray>;
/** All JSON-compatible data values */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/** Standard HTTP Status Codes */
export type HttpStatusCode =
  | 100 | 101 | 102 | 103
  | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
  | 300 | 301 | 302 | 303 | 304 | 305 | 307 | 308
  | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451
  | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

/** Standard HTTP Status Names */
export type HttpStatusName =
  | 'Continue' | 'Switching Protocols' | 'Processing' | 'Early Hints'
  | 'OK' | 'Created' | 'Accepted' | 'Non-Authoritative Information' | 'No Content' | 'Reset Content' | 'Partial Content'
  | 'Multiple Choices' | 'Moved Permanently' | 'Found' | 'See Other' | 'Not Modified' | 'Temporary Redirect' | 'Permanent Redirect'
  | 'Bad Request' | 'Unauthorized' | 'Payment Required' | 'Forbidden' | 'Not Found' | 'Method Not Allowed' | 'Not Acceptable'
  | 'Proxy Authentication Required' | 'Request Timeout' | 'Conflict' | 'Gone' | 'Length Required' | 'Precondition Failed'
  | 'Payload Too Large' | 'URI Too Long' | 'Unsupported Media Type' | 'Range Not Satisfiable' | 'Expectation Failed'
  | 'I\'m a teapot' | 'Unprocessable Entity' | 'Locked' | 'Failed Dependency' | 'Too Early' | 'Upgrade Required'
  | 'Precondition Required' | 'Too Many Requests' | 'Request Header Fields Too Large' | 'Unavailable For Legal Reasons'
  | 'Internal Server Error' | 'Not Implemented' | 'Bad Gateway' | 'Service Unavailable' | 'Gateway Timeout'
  | 'HTTP Version Not Supported' | 'Variant Also Negotiates' | 'Insufficient Storage' | 'Loop Detected' | 'Network Authentication Required';

/** HTTP Methods */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT' | 'ALL' | string;

/** Standard HTTP Request/Response Headers */
export type HttpHeaderName =
  | 'Accept' | 'Accept-Charset' | 'Accept-Encoding' | 'Accept-Language' | 'Accept-Ranges'
  | 'Access-Control-Allow-Credentials' | 'Access-Control-Allow-Headers' | 'Access-Control-Allow-Methods' | 'Access-Control-Allow-Origin' | 'Access-Control-Expose-Headers' | 'Access-Control-Max-Age' | 'Access-Control-Request-Headers' | 'Access-Control-Request-Method'
  | 'Age' | 'Allow' | 'Authorization' | 'Cache-Control' | 'Connection' | 'Content-Disposition' | 'Content-Encoding' | 'Content-Language' | 'Content-Length' | 'Content-Location' | 'Content-Range' | 'Content-Security-Policy' | 'Content-Type'
  | 'Cookie' | 'Date' | 'ETag' | 'Expect' | 'Expires' | 'Forwarded' | 'From' | 'Host' | 'If-Match' | 'If-Modified-Since' | 'If-None-Match' | 'If-Range' | 'If-Unmodified-Since'
  | 'Last-Modified' | 'Location' | 'Max-Forwards' | 'Origin' | 'Pragma' | 'Proxy-Authenticate' | 'Proxy-Authorization' | 'Range' | 'Referer' | 'Referrer-Policy' | 'Retry-After'
  | 'Server' | 'Server-Timing' | 'Set-Cookie' | 'Strict-Transport-Security' | 'User-Agent' | 'Vary' | 'Via' | 'WWW-Authenticate' | 'X-Content-Type-Options' | 'X-Frame-Options' | 'X-Powered-By' | 'X-Request-ID' | 'X-Forwarded-For' | 'X-Forwarded-Proto' | string;

/** Common Media MIME Types */
export type MimeType =
  | 'application/json' | 'text/html' | 'text/plain' | 'text/css' | 'text/javascript' | 'application/javascript'
  | 'application/xml' | 'text/xml' | 'multipart/form-data' | 'application/x-www-form-urlencoded'
  | 'image/png' | 'image/jpeg' | 'image/gif' | 'image/svg+xml' | 'image/webp' | 'image/x-icon'
  | 'audio/mpeg' | 'audio/ogg' | 'video/mp4' | 'video/webm' | 'application/pdf' | 'application/octet-stream' | string;

/** Base HTTP Error class for Velociradix exceptions */
export class HttpError extends Error {
  /** The HTTP status code (e.g. 400, 401, 404, 500) */
  status: number;
  /** Error details context object */
  details?: Record<string, JsonValue>;
  constructor(status: number, message: string, details?: Record<string, JsonValue>);
}

/** 400 Bad Request error exception */
export class BadRequestError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }
/** 401 Unauthorized error exception */
export class UnauthorizedError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }
/** 403 Forbidden error exception */
export class ForbiddenError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }
/** 404 Not Found error exception */
export class NotFoundError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }
/** 405 Method Not Allowed error exception */
export class MethodNotAllowedError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }
/** 409 Conflict error exception */
export class ConflictError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }
/** 422 Unprocessable Entity error exception */
export class UnprocessableEntityError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }
/** 429 Too Many Requests error exception */
export class TooManyRequestsError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }
/** 500 Internal Server Error exception */
export class InternalServerError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }
/** 502 Bad Gateway error exception */
export class BadGatewayError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }
/** 503 Service Unavailable error exception */
export class ServiceUnavailableError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }
/** 504 Gateway Timeout error exception */
export class GatewayTimeoutError extends HttpError { constructor(message?: string, details?: Record<string, JsonValue>); }

/** Validation Rule Type */
export type ValidationRuleType = 'string' | 'number' | 'boolean' | 'email' | 'array' | 'object' | 'date';

/** Single Field Validation Rule */
export interface ValidationRule {
  type?: ValidationRuleType;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

/** Schema Validation Rules Map */
export type ValidationRulesMap = Record<string, ValidationRule>;

/** Validation Error Detail */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  rule?: string;
}

/** Validation Result Container */
export interface ValidationResult<T = Record<string, any>> {
  valid: boolean;
  errors?: ValidationErrorDetail[];
  data?: T;
}

/** Standard JSON API Response Wrapper */
export interface JsonResponsePayload<T = JsonValue> {
  status?: number | string;
  message?: string;
  data?: T;
  error?: string;
  details?: Record<string, JsonValue>;
  meta?: Record<string, JsonValue>;
}

/** Paginated API Data Response Wrapper */
export interface PaginatedResponse<T = any> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Extendable User State Interface */
export interface ContextState extends Record<string, any> {}

/** Extendable User Session Interface */
export interface ContextSession extends Record<string, any> {}

/** Cookie configuration options for `ctx.setCookie()` */
export interface SetCookieOptions {
  /** If true, cookie cannot be accessed via client JS (`document.cookie`) */
  httpOnly?: boolean;
  /** If true, cookie is only sent over HTTPS */
  secure?: boolean;
  /** Expiration time in seconds from current time */
  maxAge?: number;
  /** Cookie URL path scope */
  path?: string;
  /** Cookie domain scope */
  domain?: string;
  /** SameSite attribute ('Strict' | 'Lax' | 'None') */
  sameSite?: 'Strict' | 'Lax' | 'None' | string;
}

/** CORS middleware configuration options */
export interface CorsOptions {
  /** Allowed origins (default: '*') */
  origin?: string;
  /** Allowed HTTP methods (default: 'GET,POST,PUT,DELETE,PATCH,OPTIONS') */
  methods?: string;
  /** Allowed request headers (default: 'Content-Type,Authorization') */
  headers?: string;
  /** Allow credentials / cookies (Access-Control-Allow-Credentials) */
  credentials?: boolean;
  /** Preflight cache duration in seconds (Access-Control-Max-Age) */
  maxAge?: number;
}

/** Bearer Auth middleware configuration options */
export interface BearerAuthOptions {
  /** Expected static token string */
  token?: string;
  /** Custom token verification function */
  verify?: (token: string, ctx: Context) => boolean;
}

/** JWT Auth middleware configuration options */
export interface JwtAuthOptions {
  /** Secret key used to verify HMAC-SHA256 JWT signature */
  secret: string;
}

/** JWT Signing options */
export interface JwtSignOptions {
  /** Algorithm (default: 'HS256') */
  alg?: string;
  /** Expiration time in seconds from creation time */
  expiresIn?: number;
}

/** Rate Limiting options */
export interface RateLimitOptions {
  /** Time window in milliseconds (default: 60000) */
  windowMs?: number;
  /** Max request limit per IP per window (default: 100) */
  max?: number;
  /** Error response message when rate limit exceeded */
  message?: string;
}

/** Progressive Slow Down options */
export interface SlowDownOptions {
  /** Milliseconds of delay added per request after threshold (default: 500) */
  delayMs?: number;
  /** Request count threshold before slowing down (default: 5) */
  delayAfter?: number;
  /** Time window in milliseconds for resetting hit counts (default: 60000) */
  windowMs?: number;
}

/** In-Memory Response Cache options */
export interface CacheOptions {
  /** Time-To-Live duration in milliseconds for cached response (default: 10000) */
  ttlMs?: number;
  /** Maximum number of entries stored in cache before LRU eviction (default: 1000) */
  maxSize?: number;
}

/** Helmet Security Headers options */
export interface HelmetOptions {
  /** X-Frame-Options value (default: 'SAMEORIGIN') */
  frameOptions?: string;
  /** Referrer-Policy value (default: 'no-referrer') */
  referrerPolicy?: string;
}

/** Request Logger options */
export interface LoggerOptions {
  /** Custom logging function (default: console.log) */
  logger?: (msg: string) => void;
  /** Optionally include detailed response object stats in logs (default: false) */
  includeRes?: boolean;
}

/** Cookie Session options */
export interface SessionOptions {
  /** Secret key used to encrypt session data */
  secret: string;
  /** Session cookie name (default: '_session') */
  name?: string;
  /** Cookie options */
  cookie?: SetCookieOptions;
}

/** Response Compression options */
export interface CompressOptions {
  /** Byte threshold before compressing response (default: 1024) */
  threshold?: number;
}

/** CSRF Protection options */
export interface CsrfOptions {
  /** Cookie name storing CSRF token */
  cookieName?: string;
  /** Request header name carrying CSRF token */
  headerName?: string;
}

/** Request Correlation ID options */
export interface RequestIdOptions {
  /** Custom header name for request correlation ID (default: 'X-Request-ID') */
  headerName?: string;
}

/** Graceful Shutdown options */
export interface GracefulShutdownOptions {
  /** Callback executed when application server finishes shutting down */
  onShutdown?: () => void;
}

/** OpenAPI Specification generator options */
export interface OpenAPISpecOptions {
  /** Title of the API (default: 'Velociradix API') */
  title?: string;
  /** Version string of the API (default: '1.0.0') */
  version?: string;
  /** Optional summary description of the API */
  description?: string;
}

/** Zod-like or Custom Schema Validator Interface */
export interface ZodLikeSchema {
  safeParse?: (data: unknown) => { success: boolean; data?: unknown; error?: { issues?: Array<{ path: (string | number)[]; message: string }>; message?: string } };
  parse?: (data: unknown) => unknown;
}

/** Schema validation object interface */
export interface SchemaValidationObject {
  /** Function validating route parameters */
  params?: (params: Record<string, string>) => string | undefined;
  /** Function validating URL query string */
  query?: (query: Record<string, string>) => string | undefined;
  /** Function or Zod-like schema validating request body */
  body?: ((body: JsonValue) => string | undefined) | ZodLikeSchema;
  /** Function validating request headers */
  headers?: (headers: Record<string, string>) => string | undefined;
}

/** OpenAPI 3.0 specification object */
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, Record<string, {
    summary: string;
    responses: Record<string, { description: string }>;
  }>>;
}

/** Postman Collection generator options */
export interface PostmanCollectionOptions {
  name?: string;
  id?: string;
  description?: string;
  baseUrl?: string;
}

/** Postman Collection v2.1.0 specification object */
export interface PostmanCollection {
  info: {
    name: string;
    _postman_id: string;
    description: string;
    schema: string;
  };
  item: Array<{
    name: string;
    request: {
      description?: string;
      method: string;
      header: Array<{ key: string; value: string }>;
      url: {
        raw: string;
        protocol: string;
        host: string[];
        port: string;
        path: string[];
        query?: Array<{ key: string; value: string }>;
      };
      body?: {
        mode: string;
        raw: string;
      };
    };
  }>;
}

export interface IpFilterOptions {
  allow?: string[];
  deny?: string[];
  statusCode?: number;
}

export interface ResponseTimeOptions {
  headerName?: string;
  digits?: number;
}

export interface SizeLimitOptions {
  maxSize?: number;
}

export interface MaintenanceOptions {
  enabled?: boolean | ((ctx: Context) => boolean);
  message?: string;
  retryAfter?: number;
}

export interface BasicAuthOptions {
  users?: Record<string, string>;
  realm?: string;
}

export interface CspOptions {
  policy?: string;
}

export interface TimeoutOptions {
  timeoutMs?: number;
}

export interface MethodOverrideOptions {
  headerName?: string;
}

export interface ApiKeyOptions {
  keys?: string[];
  headerName?: string;
  queryName?: string;
}

export interface AllowedMethodsOptions {
  methods?: string[];
}

export interface HeaderInjectorOptions {
  headers?: Record<string, string>;
}

export interface RedirectorOptions {
  rules?: Record<string, string | { url: string; code?: number }>;
}

export interface ConcurrencyLimitOptions {
  maxConcurrent?: number;
}

export interface EtagOptions {
  weak?: boolean;
}

export interface UserAgentBlockerOptions {
  bots?: RegExp[];
}

export interface BodyCleanerOptions {
  trim?: boolean;
}

export interface HostGuardOptions {
  hosts?: string[];
}

export interface AuditLogOptions {
  onAudit?: (event: Record<string, JsonValue>) => void;
}

export interface FaviconOptions {
  icon?: string;
}

/** Express response shim interface for Express middleware compatibility */
export interface ExpressResponseShim {
  setHeader(key: string, value: string | number | string[]): this;
  getHeader(key: string): string | number | string[] | undefined;
  get(key: string): string | number | string[] | undefined;
  removeHeader(key: string): this;
  hasHeader(key: string): boolean;
  writeHead(statusCode: number, headers?: Record<string, string | number | string[]>): this;
  status(code: number): this;
  sendStatus(code: number): this;
  json(body: any): this;
  send(body: any): this;
  end(chunk?: any, encoding?: string, cb?: () => void): this;
  statusCode: number;
  headersSent: boolean;
  finished: boolean;
  _header: string | null;
  writableEnded: boolean;
  on(event: string, listener: (...args: any[]) => void): this;
  once(event: string, listener: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): boolean;
}

/** Per-route middleware and metadata options */
export interface RouteOptions {
  /** Array of route-specific middlewares */
  middlewares?: Middleware[];
  /** Name of the request action (e.g. 'Add User') */
  name?: string;
  /** Detailed route description for API documentation */
  description?: string;
  /** Request headers array */
  headers?: Array<{ key: string; value: string } | string>;
  /** Request body payload sample */
  body?: JsonValue;
  /** Query parameters array */
  query?: Array<{ key: string; value: string } | string>;
  /** Sample response payload */
  sampleResponse?: JsonValue;
}

/** File serving options for `ctx.sendFile()` */
export interface SendFileOptions {
  /** Custom Content-Type header */
  contentType?: string;
}

/** Incoming HTTP Request object */
export interface Request {
  /** HTTP Method string ('GET', 'POST', etc.) */
  readonly method: string;
  /** Full URL path string */
  readonly url: string;
  /** Original URL path string for proxy/Express compatibility */
  readonly originalUrl: string;
  /** Path portion of URL */
  readonly path: string;
  /** Query string portion of URL */
  readonly query: string;
  /** Raw HTTP request body string */
  readonly body: string;
  /** Key-value object of lowercased HTTP request headers */
  readonly headers: Record<string, string>;
  /** Array of raw unparsed header key-value strings */
  readonly rawHeaders: string[];
  /** Key-value object of route path parameters (e.g. `:id`) */
  readonly params: Record<string, string>;
  /** Client IP address */
  readonly ip: string;
  /** Proxy IP address chain from X-Forwarded-For */
  readonly ips: string[];
  /** Request ID for correlation tracking */
  readonly requestId: string;
  /** True if request is HTTPS */
  readonly secure: boolean;
  /** True if request is AJAX / X-Requested-With: XMLHttpRequest */
  readonly xhr: boolean;
  /** HTTP Protocol version string (e.g. '1.1') */
  readonly httpVersion: string;
  /** Request start high-resolution timestamp */
  readonly _startTime?: [number, number] | number;
  /** Low-level socket reference placeholder */
  readonly socket?: any;
  /** Low-level connection reference placeholder */
  readonly connection?: any;
  /** Get header value by case-insensitive name */
  get(name: string): string | undefined;
  /** Get header value by case-insensitive name (alias) */
  header(name: string): string | undefined;
}

/** Outgoing HTTP Response helper interface */
export interface Response {
  /** HTTP Status Code (default: 200) */
  statusCode: number;
  /** True if response headers have been sent */
  headersSent: boolean;
  /** True if response output stream has finished */
  finished: boolean;
  /** Formatted raw response header string */
  _header: string | null;
  /** True if writable stream has ended */
  writableEnded: boolean;
  /** True if response has already been sent to client */
  done: boolean;

  /** Sets the HTTP status code for the response */
  status(code: number): this;

  /** Sets a single response header */
  setHeader(key: string, value: string | number | string[]): this;
  /** Gets a single response header */
  getHeader(key: string): string | number | string[] | undefined;
  /** Removes a response header */
  removeHeader(key: string): this;
  /** Checks if response header is present */
  hasHeader(key: string): boolean;
  /** Writes response status line and headers */
  writeHead(statusCode: number, headers?: Record<string, string | number | string[]>): this;

  /** Sets response headers using chaining or a key-value object */
  set(key: string, value: string | number | string[]): this;
  set(headers: Record<string, string | number | string[]>): this;

  /** Sets a Set-Cookie header */
  setCookie(name: string, value: string, opts?: SetCookieOptions): this;

  /** Clears a cookie by setting Max-Age=0 */
  clearCookie(name: string, opts?: SetCookieOptions): this;

  /** Encrypts data using AES-256-CBC and sets an encrypted cookie */
  setEncryptedCookie<T extends JsonValue = JsonValue>(name: string, value: T, secret: string, opts?: SetCookieOptions): this;

  /** Decrypts and parses an encrypted cookie */
  getEncryptedCookie<T extends JsonValue = JsonValue>(name: string, secret: string): T | undefined;

  /** Sends raw string, Buffer, or JSON response to the client */
  send(v: string | Uint8Array | JsonValue): this;

  /** Sends a JSON response with Content-Type: application/json */
  json(v: JsonValue): this;

  /** Sends an HTML response with Content-Type: text/html */
  html(v: string): this;

  /** Redirects the request to a target URL */
  redirect(url: string, code?: number): this;

  /** Sets Content-Disposition header for file download */
  attachment(filename: string): this;

  /** Sets anti-caching HTTP headers (`no-store, no-cache`) */
  noCache(): this;

  /** Sets Cache-Control header with max-age in seconds */
  cache(seconds: number): this;

  /** Serves a file from disk with ETag, 304 Not Modified, and Range Request (HTTP 206) support */
  sendFile(filepath: string, opts?: SendFileOptions): this;

  /** Enables response compression if Accept-Encoding matches gzip/deflate */
  compress(): this;

  /** Renders a string template by interpolating `{{ variable }}` tags */
  renderHtml(template: string, data?: Record<string, string | number | boolean | null>): this;

  /** Escapes HTML special characters in string to prevent XSS */
  sanitizeHtml(str: string): string;

  /** Starts a Server-Timing metric timer */
  time(label: string): this;

  /** Stops a Server-Timing metric timer and appends duration to Server-Timing header */
  timeEnd(label: string): this;

  /** Subscribes to response lifecycle events ('finish', 'close') */
  on(event: string, listener: (...args: any[]) => void): this;
  /** Subscribes to a single response event */
  once(event: string, listener: (...args: any[]) => void): this;
  /** Emits a response event */
  emit(event: string, ...args: any[]): boolean;
}

/** Context object passed to every route handler and middleware */
export interface Context extends Response {
  /** Incoming Request instance */
  readonly req: Request;
  /** Outgoing Response reference (alias to ctx) */
  readonly res: Response;
  /** Transient key-value state object shared across middlewares */
  state: Record<string, JsonValue>;
  /** Cookie-backed encrypted session object */
  session: Record<string, JsonValue>;

  /** Case-insensitive header lookup on incoming request */
  get(name: string): string | undefined;

  /** Returns value of parsed URL query parameter */
  query(key: string): string | undefined;

  /** Returns value of parsed cookie by name */
  cookie(key: string): string | undefined;

  /** Key-value object of route path parameters (e.g. `:id`) */
  readonly params: Record<string, string>;

  /** URL path string (shortcut to ctx.req.path) */
  readonly path: string;

  /** HTTP method string (shortcut to ctx.req.method) */
  readonly method: string;

  /** Full request URL string (shortcut to ctx.req.url) */
  readonly url: string;

  /** Alias to ctx.req */
  readonly request: Request;

  /** System uptime and memory usage metrics */
  readonly metrics: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
  };

  /** Resolved client IP address (respects `setTrustProxy` if enabled) */
  readonly ip: string;
  /** Array of proxy IPs from X-Forwarded-For */
  readonly ips: string[];
  /** True if request was made over HTTPS */
  readonly secure: boolean;
  /** True if request is AJAX (X-Requested-With: XMLHttpRequest) */
  readonly xhr: boolean;
  /** Auto-generated or incoming Request ID (`X-Request-ID`) */
  readonly requestId: string;

  /** Extracts Bearer token string from Authorization header */
  bearerToken(): string | undefined;

  /** Extracts and decodes Basic Auth credentials from Authorization header */
  basicAuth(): { username: string; password: string } | undefined;

  /** Signs a JWT payload using HMAC-SHA256 */
  jwtSign(payload: Record<string, string | number | boolean>, secret: string, opts?: JwtSignOptions): string;

  /** Verifies and decodes a Bearer JWT token from request headers */
  jwtVerify<T extends Record<string, JsonValue> = Record<string, JsonValue>>(secret: string): T;

  /** Generates or retrieves double-submit CSRF cookie token */
  csrfToken(): string;

  /** Validates request parameters, query string, or body using validation callbacks or Zod schemas */
  validate<T = Record<string, any>>(schema: SchemaValidationObject | ZodLikeSchema): T;

  /** Checks Content-Type acceptability against requested types */
  accepts(...types: string[]): string | boolean;

  /** Checks if incoming Content-Type matches target type */
  is(type: string): boolean;

  /** Parses JSON request body asynchronously */
  body<T extends JsonValue = JsonValue>(): Promise<T>;

  /** Receives request body buffer chunk */
  onChunk(cb: (chunk: Buffer) => void | Promise<void>): Promise<void>;

  /** Streams a Node.js Readable stream as the response */
  sendStream(stream: Readable, contentType?: string): Promise<void>;

  /** Begins a Server-Sent Events (SSE) stream */
  sse(
    cb: (
      sendEvent: <T extends JsonValue = JsonValue>(data: T, event?: string) => void,
      close: () => void
    ) => void
  ): void;
}

/** Next function callback in middleware chain */
export type NextFunction = () => Promise<void> | void;
/** Middleware handler function */
export type Middleware = (ctx: Context, next: NextFunction) => Promise<void | Response> | void | Response;
/** Route handler function */
export type Handler = (ctx: Context) => Promise<JsonValue | Response | Uint8Array | void> | JsonValue | Response | Uint8Array | void;

/** Route Group interface created via `app.group()` */
export interface RouteGroup {
  get(path: string, handler: Handler, options?: RouteOptions): RouteGroup;
  post(path: string, handler: Handler, options?: RouteOptions): RouteGroup;
  put(path: string, handler: Handler, options?: RouteOptions): RouteGroup;
  delete(path: string, handler: Handler, options?: RouteOptions): RouteGroup;
  del(path: string, handler: Handler, options?: RouteOptions): RouteGroup;
  patch(path: string, handler: Handler, options?: RouteOptions): RouteGroup;
  head(path: string, handler: Handler, options?: RouteOptions): RouteGroup;
  options(path: string, handler: Handler, options?: RouteOptions): RouteGroup;
  all(path: string, handler: Handler, options?: RouteOptions): RouteGroup;
  group(prefix: string, cb: (group: RouteGroup) => void): RouteGroup;
}

/** Velociradix Application instance interface */
export interface App {
  /** Register ultra-fast C++ response fast-path route */
  fastRoute(method: string, path: string, data: any, status?: number, headers?: Record<string, string>): App;
  /** Register ultra-fast C++ GET fast-path response */
  fastGet(path: string, data: any, status?: number, headers?: Record<string, string>): App;
  /** Register ultra-fast C++ POST fast-path response */
  fastPost(path: string, data: any, status?: number, headers?: Record<string, string>): App;
  /** Register GET route */
  get(path: string, handler: Handler, options?: RouteOptions): App;
  /** Register POST route */
  post(path: string, handler: Handler, options?: RouteOptions): App;
  /** Register PUT route */
  put(path: string, handler: Handler, options?: RouteOptions): App;
  /** Register DELETE route */
  delete(path: string, handler: Handler, options?: RouteOptions): App;
  /** Register DELETE route (alias) */
  del(path: string, handler: Handler, options?: RouteOptions): App;
  /** Register PATCH route */
  patch(path: string, handler: Handler, options?: RouteOptions): App;
  /** Register HEAD route */
  head(path: string, handler: Handler, options?: RouteOptions): App;
  /** Register OPTIONS route */
  options(path: string, handler: Handler, options?: RouteOptions): App;
  /** Register route for ALL HTTP methods */
  all(path: string, handler: Handler, options?: RouteOptions): App;

  /** Registers a path redirect from one route to another */
  redirectRoute(fromPath: string, toPath: string, status?: number): App;

  /**
   * Registers a 404 Not Found fallback handler for all unmatched routes.
   *
   * @example
   * ```ts
   * app.notFound((ctx) => ctx.status(404).json({ error: 'Page Not Found' }));
   * ```
   */
  notFound(handler: Handler): App;
  notfound(handler: Handler): App;

  /** Generates Postman Collection v2.1.0 specification JSON object */
  postman(options?: PostmanCollectionOptions): PostmanCollection;

  /** Serves an interactive Postman-style API documentation web page at specified path */
  postmanDoc(docsPath?: string, options?: PostmanCollectionOptions): App;

  /** Generates OpenAPI 3.0 specification JSON object for registered routes */
  openapi(specOpts?: OpenAPISpecOptions): OpenAPISpec;

  /** Serves an interactive Swagger UI web interface at specified path */
  swagger(docsPath?: string): App;

  /** Registers a health check status endpoint */
  health(path?: string, checkFn?: () => Promise<Record<string, JsonValue>> | Record<string, JsonValue>): App;

  /** Listens for SIGINT/SIGTERM signals to perform graceful shutdown */
  gracefulShutdown(opts?: GracefulShutdownOptions): App;

  /** Enables or disables Trust Proxy IP resolution for X-Forwarded-For headers */
  setTrustProxy(val: boolean): App;

  /** Registers a global middleware function */
  use(mw: Middleware): App;

  /** Express middleware compatibility shim adapter */
  useExpress(fn: (req: Request, res: ExpressResponseShim, next: NextFunction) => void): App;

  /** Express Router compatibility adapter for mounting Express Router instances */
  useExpressRouter(prefixOrRouter: string | ((req: any, res: any, next: any) => void), router?: (req: any, res: any, next: any) => void): App;

  /** Groups routes under a common URL path prefix */
  group(prefix: string, cb: (group: RouteGroup) => void): App;

  /** Enables CORS middleware with custom options */
  enableCors(options?: CorsOptions): App;

  /** Registers native C++ static file directory serving */
  static(prefix: string, dir: string): App;

  /** Serves static directory with extended sendFile options */
  serveStatic(prefix: string, dir: string, opts?: SendFileOptions): App;

  /** Hosts built-in self-hosted Postman API Documentation Playground */
  postmanDoc(docsPath?: string, options?: { name?: string; description?: string }): App;
  /** Generates Postman Collection v2.1.0 JSON payload */
  postman(options?: { name?: string; description?: string; baseUrl?: string }): Record<string, JsonValue>;

  /** Hosts interactive Swagger UI documentation playground */
  swagger(docsPath?: string): App;
  /** Generates OpenAPI 3.0 JSON specification object */
  exportOpenAPI(options?: { title?: string; version?: string; description?: string; baseUrl?: string }): Record<string, JsonValue>;
  /** Generates Postman Collection v2.1.0 JSON payload */
  exportPostman(name?: string): Record<string, JsonValue>;

  /** Serves interactive real-time Metrics UI dashboard at specified path */
  metricsUI(dashPath?: string): App;

  /** Registers callback function to execute on server graceful shutdown */
  onShutdown(fn: () => void | Promise<void>): App;

  /** Scales application workers across CPU cluster cores */
  cluster(options?: { workers?: number }): App;

  /** Sets maximum request body payload limit in bytes */
  setPayloadLimit(n: number): App;
  /** Sets number of C++ worker threads for multithreaded event loop */
  setWorkers(n: number): App;

  /** Registers global error handler callback */
  onError(fn: (err: Error | HttpError, ctx: Context) => Promise<JsonValue | Record<string, JsonValue> | void> | JsonValue | Record<string, JsonValue> | void): App;

  /** Subscribes to application lifecycle events ('request' | 'response') */
  on(event: 'request' | 'response', listener: (ctx: Context) => void): App;
  /** Subscribes to application error events */
  on(event: 'error', listener: (err: Error, ctx: Context) => void): App;
  /** Emits a lifecycle event on application event bus */
  emit(event: 'request' | 'response', ctx: Context): boolean;
  /** Emits an error event on application event bus */
  emit(event: 'error', err: Error, ctx: Context): boolean;

  /** Starts listening for HTTP requests on port and host */
  listen(port: number, callback?: () => void): App;
  listen(port: number, host: string, callback?: () => void): App;

  /** Stops the HTTP server */
  close(): App;
}

/** Creates and initializes a new Velociradix application instance */
export function createApp(): App;
/** Default pre-instantiated global application instance */
export const app: App;

/** Signs a JWT payload using HMAC-SHA256 */
export function jwtSign(payload: Record<string, string | number | boolean>, secret: string, opts?: JwtSignOptions): string;
/** Verifies and decodes a JWT token */
export function jwtVerify<T extends Record<string, JsonValue> = Record<string, JsonValue>>(token: string, secret: string): T;
/** Encrypts string text using AES-256-CBC */
export function encryptValue(text: string, secretKey: string): string;
/** Decrypts encrypted text using AES-256-CBC */
export function decryptValue(encryptedText: string, secretKey: string): string | undefined;

/** Request logger middleware generator */
export function logger(options?: LoggerOptions): Middleware;
/** CORS middleware generator */
export function cors(options?: CorsOptions): Middleware;
/** Bearer Auth token protection middleware generator */
export function bearerAuth(options?: BearerAuthOptions): Middleware;
/** JWT Authentication protection middleware generator */
export function jwtAuth(options?: JwtAuthOptions): Middleware;
/** Response Gzip/Deflate compression middleware generator */
export function compress(options?: CompressOptions): Middleware;
/** Double-Submit Cookie CSRF protection middleware generator */
export function csrf(options?: CsrfOptions): Middleware;
/** In-Memory Response Cache middleware generator */
export function cache(options?: CacheOptions): Middleware;
/** Request Correlation ID middleware generator */
export function requestId(options?: RequestIdOptions): Middleware;
/** Request Schema Validation middleware generator */
export function validate(schema?: SchemaValidationObject): Middleware;
/** XSS sanitization middleware generator */
export function sanitize(): Middleware;
/** Cookie Session middleware generator */
export function session(options?: SessionOptions): Middleware;
/** Progressive Slow Down middleware generator */
export function slowDown(options?: SlowDownOptions): Middleware;
/** Rate Limiting middleware generator */
export function rateLimit(options?: RateLimitOptions): Middleware;
/** Helmet Security Headers middleware generator */
export function helmet(options?: HelmetOptions): Middleware;
/** IP Whitelist / Blacklist Filter middleware generator */
export function ipFilter(options?: IpFilterOptions): Middleware;
/** Response Time Header middleware generator */
export function responseTime(options?: ResponseTimeOptions): Middleware;
/** Request Body Payload Size Limit middleware generator */
export function sizeLimit(options?: SizeLimitOptions): Middleware;
/** Maintenance Mode toggle middleware generator */
export function maintenance(options?: MaintenanceOptions): Middleware;
/** Basic Auth Authentication middleware generator */
export function basicAuth(options?: BasicAuthOptions): Middleware;
/** Content Security Policy header middleware generator */
export function csp(options?: CspOptions): Middleware;
/** Request Timeout middleware generator */
export function timeout(options?: TimeoutOptions): Middleware;
/** HTTP Method Override header middleware generator */
export function methodOverride(options?: MethodOverrideOptions): Middleware;
/** API Key Authentication middleware generator */
export function apiKey(options?: ApiKeyOptions): Middleware;
/** HTTP Allowed Methods guard middleware generator */
export function allowedMethods(options?: AllowedMethodsOptions): Middleware;
/** Custom Response Header Injector middleware generator */
export function headerInjector(headers?: Record<string, string>): Middleware;
/** Route URL Redirector middleware generator */
export function redirector(rules?: Record<string, string | { url: string; code?: number }>): Middleware;
/** Concurrency Throttler middleware generator */
export function concurrencyLimit(options?: ConcurrencyLimitOptions): Middleware;
/** ETag Generator middleware generator */
export function etag(options?: EtagOptions): Middleware;
/** Bot & User Agent Blocker middleware generator */
export function userAgentBlocker(options?: UserAgentBlockerOptions): Middleware;
/** Request Body String Trimmer middleware generator */
export function bodyCleaner(options?: BodyCleanerOptions): Middleware;
/** Conditional Request (If-Modified-Since) middleware generator */
export function conditionalRequest(): Middleware;
/** Host Header Guard middleware generator */
export function hostGuard(options?: HostGuardOptions): Middleware;
/** Audit Trail Logger middleware generator */
export function auditLog(options?: AuditLogOptions): Middleware;
/** Favicon Fast Dismiss middleware generator */
export function favicon(options?: FaviconOptions): Middleware;

export interface VelociradixFactory {
  (): App;
  app: App;
  createApp: typeof createApp;
  jwtSign: typeof jwtSign;
  jwtVerify: typeof jwtVerify;
  encryptValue: typeof encryptValue;
  decryptValue: typeof decryptValue;
  HttpError: typeof HttpError;
  BadRequestError: typeof BadRequestError;
  UnauthorizedError: typeof UnauthorizedError;
  ForbiddenError: typeof ForbiddenError;
  NotFoundError: typeof NotFoundError;
  InternalServerError: typeof InternalServerError;
  logger: typeof logger;
  cors: typeof cors;
  bearerAuth: typeof bearerAuth;
  jwtAuth: typeof jwtAuth;
  compress: typeof compress;
  csrf: typeof csrf;
  cache: typeof cache;
  requestId: typeof requestId;
  validate: typeof validate;
  sanitize: typeof sanitize;
  session: typeof session;
  slowDown: typeof slowDown;
  rateLimit: typeof rateLimit;
  helmet: typeof helmet;
  [key: string]: any;
}

declare const velociradix: VelociradixFactory;

export default velociradix;
