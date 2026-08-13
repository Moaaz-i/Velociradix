export interface ExpressApp {
  use(...middlewares: any[]): ExpressApp;
  get(path: string, ...handlers: any[]): ExpressApp;
  post(path: string, ...handlers: any[]): ExpressApp;
  put(path: string, ...handlers: any[]): ExpressApp;
  delete(path: string, ...handlers: any[]): ExpressApp;
  listen(port: number, host?: string | (() => void), callback?: () => void): any;
  [key: string]: any;
}

export declare function express(): ExpressApp;

export declare namespace express {
  function Router(options?: any): any;
  function json(options?: any): any;
  function urlencoded(options?: any): any;
  function text(options?: any): any;
  function raw(options?: any): any;
  function static(dirPath: string, options?: any): any;
}

export default express;
