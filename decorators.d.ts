import type { Context, Middleware } from './index.mjs';

export interface ControllerOptions {
  /** Middlewares applied to all routes in this controller */
  middlewares?: Middleware[];
}

export interface RouteDecoratorOptions {
  /** Route specific middlewares */
  middlewares?: Middleware[];
  /** Route schema validation rules */
  schema?: Record<string, unknown>;
  /** Route schema validation alias */
  validate?: Record<string, unknown>;
  /** Route description for OpenAPI / Swagger */
  description?: string;
  /** Route name */
  name?: string;
}

/** Class decorator marking a class as a route controller */
export function Controller(prefix?: string, options?: ControllerOptions): ClassDecorator;

/** Method decorator for HTTP GET route */
export function Get(path?: string, options?: RouteDecoratorOptions): MethodDecorator;
/** Method decorator for HTTP POST route */
export function Post(path?: string, options?: RouteDecoratorOptions): MethodDecorator;
/** Method decorator for HTTP PUT route */
export function Put(path?: string, options?: RouteDecoratorOptions): MethodDecorator;
/** Method decorator for HTTP DELETE route */
export function Delete(path?: string, options?: RouteDecoratorOptions): MethodDecorator;
/** Method decorator for HTTP DELETE route (alias) */
export function Del(path?: string, options?: RouteDecoratorOptions): MethodDecorator;
/** Method decorator for HTTP PATCH route */
export function Patch(path?: string, options?: RouteDecoratorOptions): MethodDecorator;
/** Method decorator for HTTP HEAD route */
export function Head(path?: string, options?: RouteDecoratorOptions): MethodDecorator;
/** Method decorator for HTTP OPTIONS route */
export function Options(path?: string, options?: RouteDecoratorOptions): MethodDecorator;
/** Method decorator for all HTTP methods route */
export function All(path?: string, options?: RouteDecoratorOptions): MethodDecorator;

/** Parameter decorator extracting request body (or specific property) */
export function Body(property?: string): ParameterDecorator;
/** Parameter decorator extracting route parameter */
export function Param(property?: string): ParameterDecorator;
/** Parameter decorator extracting query parameter */
export function Query(property?: string): ParameterDecorator;
/** Parameter decorator extracting request header */
export function Headers(property?: string): ParameterDecorator;
export function Header(property?: string): ParameterDecorator;
/** Parameter decorator extracting full Velociradix Context */
export function Ctx(): ParameterDecorator;
export function Context(): ParameterDecorator;
/** Parameter decorator extracting Request object */
export function Req(): ParameterDecorator;
/** Parameter decorator extracting Response/Context */
export function Res(): ParameterDecorator;
/** Parameter decorator extracting Context state */
export function State(property?: string): ParameterDecorator;

/** Attach middlewares to a Controller class or route handler method */
export function Use(...middlewares: Middleware[]): ClassDecorator & MethodDecorator;

/** Attach schema validation to a route handler */
export function Validate(schema: Record<string, unknown>): MethodDecorator;

/** Mark a service class as injectable */
export function Injectable(token?: any): ClassDecorator;

/** Inject a dependency into a class property */
export function Inject(token: any): PropertyDecorator;

export interface DIContainer {
  register(token: any, instanceOrFactory: any): this;
  resolve<T = any>(token: any): T;
}

export const Container: DIContainer;

/**
 * Register a decorated controller class into a Velociradix app instance
 */
export function registerController(app: any, ControllerClass: any, container?: DIContainer): any;
