import type { EventEmitter } from 'node:events';

/** Express Request Interface */
export interface ExpressRequest {
  method: string;
  url: string;
  originalUrl: string;
  path: string;
  query: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
  rawHeaders: string[];
  ip: string;
  ips: string[];
  protocol: string;
  secure: boolean;
  xhr: boolean;
  httpVersion: string;
  cookies?: Record<string, string>;
  signedCookies?: Record<string, string>;
  get(name: string): string | undefined;
  header(name: string): string | undefined;
  [key: string]: unknown;
}

/** Express Response Interface */
export interface ExpressResponse extends EventEmitter {
  statusCode: number;
  headersSent: boolean;
  finished: boolean;
  writableEnded: boolean;
  _header: string | null;

  status(code: number): this;
  sendStatus(code: number): this;
  send(body?: string | Buffer | Uint8Array | object | unknown): this;
  json(body?: object | Array<unknown> | string | number | boolean | unknown): this;
  html(htmlString: string): this;
  sendFile(filepath: string, options?: Record<string, unknown>, callback?: (err?: Error) => void): this;
  redirect(url: string, status?: number): this;
  setHeader(key: string, value: string | number | string[]): this;
  getHeader(key: string): string | number | string[] | undefined;
  removeHeader(key: string): this;
  hasHeader(key: string): boolean;
  writeHead(statusCode: number, headers?: Record<string, string | number | string[]>): this;
  set(key: string, value: string | number | string[]): this;
  set(headers: Record<string, string | number | string[]>): this;
  get(key: string): string | number | string[] | undefined;
  cookie(name: string, value: string, options?: Record<string, unknown>): this;
  clearCookie(name: string, options?: Record<string, unknown>): this;
  location(url: string): this;
  type(type: string): this;
  contentType(type: string): this;
  end(chunk?: string | Buffer | Uint8Array | unknown, encoding?: string, cb?: () => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this;
  once(event: string, listener: (...args: unknown[]) => void): this;
  emit(event: string, ...args: unknown[]): boolean;
  [key: string]: unknown;
}

/** Express NextFunction callback */
export type ExpressNextFunction = (err?: Error | unknown) => void;

/** Express Request Handler Callback */
export type ExpressRequestHandler = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => unknown;

/** Express Application Instance Interface */
export interface ExpressApp {
  use(...middlewares: Array<string | ExpressRequestHandler | ExpressApp>): ExpressApp;
  get(path: string, ...handlers: ExpressRequestHandler[]): ExpressApp;
  post(path: string, ...handlers: ExpressRequestHandler[]): ExpressApp;
  put(path: string, ...handlers: ExpressRequestHandler[]): ExpressApp;
  delete(path: string, ...handlers: ExpressRequestHandler[]): ExpressApp;
  patch(path: string, ...handlers: ExpressRequestHandler[]): ExpressApp;
  head(path: string, ...handlers: ExpressRequestHandler[]): ExpressApp;
  options(path: string, ...handlers: ExpressRequestHandler[]): ExpressApp;
  all(path: string, ...handlers: ExpressRequestHandler[]): ExpressApp;
  listen(port: number, host?: string | (() => void), callback?: () => void): unknown;
  [key: string]: unknown;
}

/** Express compatibility factory */
export declare function express(): ExpressApp;

export declare namespace express {
  function Router(options?: Record<string, unknown>): ExpressApp;
  function json(options?: Record<string, unknown>): ExpressRequestHandler;
  function urlencoded(options?: Record<string, unknown>): ExpressRequestHandler;
  function text(options?: Record<string, unknown>): ExpressRequestHandler;
  function raw(options?: Record<string, unknown>): ExpressRequestHandler;
  function static(dirPath: string, options?: Record<string, unknown>): ExpressRequestHandler;
}

export default express;
