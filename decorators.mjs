/**
 * OOP Decorators & Dependency Injection for Velociradix
 * Compatible with TypeScript Experimental Decorators and standard decorators.
 */

// Helper to ensure metadata container on target/class
function getRouteMetadata(target) {
  if (!target.__velociradix_routes) {
    target.__velociradix_routes = [];
  }
  return target.__velociradix_routes;
}

function getParamsMap(target, propertyKey) {
  target.__velociradix_params = target.__velociradix_params || {};
  if (!target.__velociradix_params[propertyKey]) {
    target.__velociradix_params[propertyKey] = [];
  }
  return target.__velociradix_params[propertyKey];
}

/**
 * Controller class decorator
 * @param prefix Base route prefix (e.g. '/users')
 * @param options Additional controller options (middlewares, etc.)
 */
export function Controller(prefix = '', options = {}) {
  return function (target) {
    const classTarget = typeof target === 'function' ? target : target.constructor;
    classTarget.__velociradix_prefix = prefix;
    classTarget.__velociradix_middlewares = options.middlewares || [];

    // Transfer routes from prototype to class if needed
    if (classTarget.prototype && classTarget.prototype.__velociradix_routes) {
      classTarget.__velociradix_routes = classTarget.prototype.__velociradix_routes;
    }
    return target;
  };
}

/**
 * Method route decorator factory
 */
function createMethodDecorator(method) {
  return function (path = '', options = {}) {
    return function (target, propertyKey, descriptor) {
      const routes = getRouteMetadata(target);
      const paramsMap = getParamsMap(target, propertyKey);
      const middlewares = Array.isArray(options.middlewares) ? [...options.middlewares] : (options.middlewares ? [options.middlewares] : []);

      if (options.schema || options.validate) {
        const s = options.schema || options.validate;
        middlewares.unshift((ctx, next) => {
          ctx.validate(s);
          return next();
        });
      }

      routes.push({
        method: method.toUpperCase(),
        path: typeof path === 'string' ? path : (path.path || ''),
        propertyKey,
        middlewares,
        paramsMap,
        options,
      });

      return descriptor;
    };
  }
}

export const Get = createMethodDecorator('GET');
export const Post = createMethodDecorator('POST');
export const Put = createMethodDecorator('PUT');
export const Delete = createMethodDecorator('DELETE');
export const Del = createMethodDecorator('DELETE');
export const Patch = createMethodDecorator('PATCH');
export const Head = createMethodDecorator('HEAD');
export const Options = createMethodDecorator('OPTIONS');
export const All = createMethodDecorator('ALL');

/**
 * Parameter decorator factory
 */
function createParamDecorator(type) {
  return function (property) {
    return function (target, propertyKey, parameterIndex) {
      const paramsMap = getParamsMap(target, propertyKey);
      paramsMap[parameterIndex] = { type, property };
    };
  };
}

export const Body = createParamDecorator('body');
export const Param = createParamDecorator('param');
export const Query = createParamDecorator('query');
export const Headers = createParamDecorator('headers');
export const Header = createParamDecorator('headers');
export const Ctx = createParamDecorator('ctx');
export const Context = createParamDecorator('ctx');
export const Req = createParamDecorator('req');
export const Res = createParamDecorator('res');
export const State = createParamDecorator('state');

/**
 * Attach middlewares to class or method
 */
export function Use(...middlewares) {
  return function (target, propertyKey, descriptor) {
    if (propertyKey && descriptor) {
      // Method decorator
      const routes = getRouteMetadata(target);
      const existing = routes.find((r) => r.propertyKey === propertyKey);
      if (existing) {
        existing.middlewares.push(...middlewares);
      }
      return descriptor;
    }
    // Class decorator
    const classTarget = typeof target === 'function' ? target : target.constructor;
    classTarget.__velociradix_middlewares = classTarget.__velociradix_middlewares || [];
    classTarget.__velociradix_middlewares.push(...middlewares);
    return target;
  };
}

/**
 * Schema validation decorator
 */
export function Validate(schema) {
  return Use((ctx, next) => {
    ctx.validate(schema);
    return next();
  });
}

/**
 * Lightweight Dependency Injection Container
 */
class DIContainer {
  constructor() {
    this.services = new Map();
  }

  register(token, instanceOrFactory) {
    this.services.set(token, instanceOrFactory);
    return this;
  }

  resolve(token) {
    if (!this.services.has(token)) {
      if (typeof token === 'function') {
        const instance = new token();
        this.services.set(token, instance);
        return instance;
      }
      throw new Error(`Velociradix DI: Service not registered for token ${String(token)}`);
    }
    const val = this.services.get(token);
    if (typeof val === 'function') {
      if (val.prototype && val.prototype.constructor === val) {
        const instance = new val();
        this.services.set(token, instance);
        return instance;
      }
      return val(this);
    }
    return val;
  }
}

export const Container = new DIContainer();

export function Injectable(token) {
  return function (target) {
    Container.register(token || target, target);
    return target;
  };
}

export function Inject(token) {
  return function (target, propertyKey) {
    Object.defineProperty(target, propertyKey, {
      get() {
        return Container.resolve(token);
      },
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * Register a decorated controller onto a Velociradix app
 */
export function registerController(app, ControllerClass, container = Container) {
  const instance = typeof ControllerClass === 'function' && ControllerClass.prototype
    ? (container ? container.resolve(ControllerClass) : new ControllerClass())
    : ControllerClass;

  if (typeof app.registerController === 'function') {
    return app.registerController(instance);
  }

  return app;
}

export default {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Del,
  Patch,
  Head,
  Options,
  All,
  Body,
  Param,
  Query,
  Headers,
  Header,
  Ctx,
  Context,
  Req,
  Res,
  State,
  Use,
  Validate,
  Injectable,
  Inject,
  Container,
  registerController,
};
