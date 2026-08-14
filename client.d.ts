export interface ClientCallOptions {
  /** Query parameters */
  query?: Record<string, unknown>;
  /** Request Body */
  body?: unknown;
  /** Custom request headers */
  headers?: Record<string, string>;
  /** Bearer authentication token */
  token?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom fetch options */
  fetchOptions?: RequestInit;
  /** Hook before request is sent */
  onRequest?: (req: { url: string; init: RequestInit }) => void;
  /** Hook after response is received */
  onResponse?: (res: ClientResponse<unknown>) => void;
}

export interface ClientResponse<T = unknown> {
  /** Parsed response data (null if request failed) */
  data: T | null;
  /** Error object or message if status >= 400 */
  error: unknown | null;
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** True if HTTP status is 2xx */
  ok: boolean;
  /** Underlying Fetch Response object */
  raw: Response | null;
}

export interface ClientOptions {
  /** Custom fetch implementation */
  fetch?: typeof globalThis.fetch;
  /** Base request headers */
  headers?: Record<string, string>;
  /** Default bearer authentication token */
  token?: string;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Custom fetch options */
  fetchOptions?: RequestInit;
  /** Global hook before request is sent */
  onRequest?: (req: { url: string; init: RequestInit }) => void;
  /** Global hook after response is received */
  onResponse?: (res: ClientResponse<unknown>) => void;
}

export type ClientMethod = <T = any>(options?: ClientCallOptions) => Promise<ClientResponse<T>>;

export interface ClientCallable {
  get: ClientMethod;
  post: ClientMethod;
  put: ClientMethod;
  delete: ClientMethod;
  del: ClientMethod;
  patch: ClientMethod;
  head: ClientMethod;
  options: ClientMethod;
}

export type ClientProxy = ClientCallable & {
  [key: string]: any;
  [key: number]: any;
  (arg?: string | number): ClientProxy;
};

/**
 * Creates a type-safe RPC Proxy client for Velociradix
 *
 * @param baseUrl Base URL of the Velociradix API server (e.g. 'http://localhost:3000')
 * @param options Client configuration options
 */
export function createClient<TApp = any>(baseUrl?: string, options?: ClientOptions): ClientProxy & TApp;

export default createClient;
