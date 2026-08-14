/// <reference types="node" />
import type { EventEmitter } from 'node:events';
import type { Socket } from 'node:net';

/** Express Request Interface */
export interface ExpressRequest<Body = Record<string, unknown>, Params = Record<string, string>, Query = Record<string, string | string[] | undefined>> {
  method: string;
  url: string;
  originalUrl: string;
  path: string;
  query: Query;
  params: Params;
  body: Body;
  headers: Record<string, string | string[] | undefined>;
  rawHeaders: string[];
  ip: string;
  ips: string[];
  protocol: string;
  secure: boolean;
  xhr: boolean;
  httpVersion: string;
  socket?: Socket;
  connection?: Socket;
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
  send(body?: string | Buffer | Uint8Array | Record<string, unknown> | Array<unknown> | number | boolean | null): this;
  json(body?: Record<string, unknown> | Array<unknown> | string | number | boolean | null): this;
  html(htmlString: string): this;
  sendFile(filepath: string, options?: Record<string, unknown>, callback?: (err?: Error | null) => void): this;
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
  end(chunk?: string | Buffer | Uint8Array | null, encoding?: string, cb?: () => void): this;
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
  use(...middlewares: Array<string | ExpressRequestHandler | ExpressRouter | ExpressApp | ExpressRequestHandler[]>): ExpressApp;
  get(setting: string): unknown;
  get(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressApp;
  post(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressApp;
  put(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressApp;
  delete(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressApp;
  patch(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressApp;
  head(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressApp;
  options(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressApp;
  all(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressApp;
  route(path: string): ExpressRoute;
  set(setting: string, val: unknown): ExpressApp;
  enable(setting: string): ExpressApp;
  disable(setting: string): ExpressApp;
  enabled(setting: string): boolean;
  disabled(setting: string): boolean;
  engine(ext: string, fn: unknown): ExpressApp;
  param(name: string, fn: unknown): ExpressApp;
  path(): string;
  listen(port: number, host?: string | (() => void), callback?: () => void): unknown;
  [key: string]: unknown;
}

/** Express Router Instance Interface */
export interface ExpressRouter extends ExpressRequestHandler {
  use(...middlewares: Array<string | ExpressRequestHandler | ExpressRouter | ExpressRequestHandler[]>): ExpressRouter;
  get(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRouter;
  post(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRouter;
  put(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRouter;
  delete(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRouter;
  patch(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRouter;
  head(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRouter;
  options(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRouter;
  all(path: string, ...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRouter;
  route(path: string): ExpressRoute;
  param(name: string, fn: unknown): ExpressRouter;
  [key: string]: unknown;
}

/** Express Route Instance */
export interface ExpressRoute {
  get(...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRoute;
  post(...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRoute;
  put(...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRoute;
  delete(...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRoute;
  patch(...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRoute;
  all(...handlers: Array<ExpressRequestHandler | ExpressRequestHandler[]>): ExpressRoute;
}

/** Express compatibility factory */
export declare function express(): ExpressApp;

export declare namespace express {
  function Router(options?: Record<string, unknown>): ExpressRouter;
  function json(options?: Record<string, unknown>): ExpressRequestHandler;
  function urlencoded(options?: Record<string, unknown>): ExpressRequestHandler;
  function text(options?: Record<string, unknown>): ExpressRequestHandler;
  function raw(options?: Record<string, unknown>): ExpressRequestHandler;
  function static(dirPath: string, options?: Record<string, unknown>): ExpressRequestHandler;
}

export declare const Router: typeof express.Router;
export declare const json: typeof express.json;
export declare const urlencoded: typeof express.urlencoded;
export declare const text: typeof express.text;
export declare const raw: typeof express.raw;
export declare const serveStatic: typeof express.static;
export { serveStatic as static };

export default express;

