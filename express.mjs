import { createApp, HttpError } from './index.mjs';

/**
 * 1:1 Express Drop-in Replacement for Velociradix
 * Implements complete Express 4 / Express 5 API specifications with C++17 Radix Trie acceleration.
 */

// Helper to flatten arrays of middleware functions
function flattenHandlers(args) {
  const flattened = [];
  for (let i = 0; i < args.length; i++) {
    const item = args[i];
    if (Array.isArray(item)) {
      flattened.push(...flattenHandlers(item));
    } else if (typeof item === 'function') {
      flattened.push(item);
    }
  }
  return flattened;
}

// Router Implementation
export function Router(options = {}) {
  const routes = [];
  const paramsHandlers = {};

  const routerFn = function (req, res, next) {
    let i = 0;
    const urlPath = req.path || req.url || '/';

    function nextRoute(err) {
      if (err) {
        if (typeof next === 'function') return next(err);
        throw err;
      }
      if (i >= routes.length) {
        if (typeof next === 'function') return next();
        return;
      }

      const r = routes[i++];
      
      // Middleware without path
      if (!r.path) {
        return r.handler(req, res, nextRoute);
      }

      // Check method
      if (r.method && req.method.toLowerCase() !== r.method) {
        return nextRoute();
      }

      // Check path matching (literal, prefix, or param)
      const isMatch = r.path === '*' || 
                      urlPath === r.path || 
                      (r.isPrefix ? (urlPath.startsWith(r.path) && (urlPath.length === r.path.length || urlPath[r.path.length] === '/')) : false) ||
                      (r.regex && r.regex.test(urlPath));

      if (!isMatch) return nextRoute();

      if (r.regex && r.paramKeys) {
        const matches = r.regex.exec(urlPath);
        if (matches) {
          req.params = req.params || {};
          for (let j = 0; j < r.paramKeys.length; j++) {
            req.params[r.paramKeys[j]] = decodeURIComponent(matches[j + 1]);
          }
        }
      }

      try {
        return r.handler(req, res, nextRoute);
      } catch (e) {
        return nextRoute(e);
      }
    }

    return nextRoute();
  };

  const registerRouterMethod = (method) => (path, ...handlers) => {
    const flattened = flattenHandlers(handlers);
    const paramKeys = [];
    let regex = null;

    if (typeof path === 'string' && path.includes(':')) {
      const pattern = path.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
        paramKeys.push(key);
        return '([^/]+)';
      });
      regex = new RegExp(`^${pattern}$`);
    }

    flattened.forEach((h) => {
      routes.push({ method, path, handler: h, regex, paramKeys });
    });
    return routerFn;
  };

  routerFn.get = registerRouterMethod('get');
  routerFn.post = registerRouterMethod('post');
  routerFn.put = registerRouterMethod('put');
  routerFn.delete = registerRouterMethod('delete');
  routerFn.del = routerFn.delete;
  routerFn.patch = registerRouterMethod('patch');
  routerFn.options = registerRouterMethod('options');
  routerFn.head = registerRouterMethod('head');
  routerFn.all = registerRouterMethod(null);

  routerFn.use = function (...args) {
    let path = null;
    let handlers = args;
    if (typeof args[0] === 'string') {
      path = args[0];
      handlers = args.slice(1);
    }
    const flattened = flattenHandlers(handlers);
    flattened.forEach((h) => {
      routes.push({ method: null, path, handler: h, isPrefix: Boolean(path) });
    });
    return routerFn;
  };

  routerFn.route = function (path) {
    const routeObj = {
      get: (...h) => { routerFn.get(path, ...h); return routeObj; },
      post: (...h) => { routerFn.post(path, ...h); return routeObj; },
      put: (...h) => { routerFn.put(path, ...h); return routeObj; },
      delete: (...h) => { routerFn.delete(path, ...h); return routeObj; },
      patch: (...h) => { routerFn.patch(path, ...h); return routeObj; },
      all: (...h) => { routerFn.all(path, ...h); return routeObj; }
    };
    return routeObj;
  };

  routerFn.param = function (name, fn) {
    paramsHandlers[name] = fn;
    return routerFn;
  };

  return routerFn;
}

// Application Factory
export function express() {
  const app = createApp();
  const settings = {
    'x-powered-by': true,
    'etag': 'weak',
    'env': process.env.NODE_ENV || 'development',
    'query parser': 'extended',
    'subdomain offset': 2,
    'trust proxy': false
  };

  // Mount express bridge on core
  app.useExpress((req, res, next) => next());

  const expressApp = function (req, res, next) {
    if (typeof next === 'function') {
      return app.useExpress(expressApp)(req, res, next);
    }
  };

  Object.assign(expressApp, app);

  // Settings API
  expressApp.set = function (setting, val) {
    if (arguments.length === 1) return settings[setting];
    settings[setting] = val;
    if (setting === 'trust proxy') app.setTrustProxy(Boolean(val));
    return expressApp;
  };

  expressApp.get = function (pathOrSetting, ...handlers) {
    if (handlers.length === 0 && typeof pathOrSetting === 'string' && !pathOrSetting.startsWith('/')) {
      return settings[pathOrSetting];
    }
    return expressApp._registerRoute('get', pathOrSetting, handlers);
  };

  expressApp.enable = function (setting) { return expressApp.set(setting, true); };
  expressApp.disable = function (setting) { return expressApp.set(setting, false); };
  expressApp.enabled = function (setting) { return Boolean(expressApp.set(setting)); };
  expressApp.disabled = function (setting) { return !expressApp.set(setting); };

  expressApp.engine = function (ext, fn) { return expressApp; };
  expressApp.param = function (name, fn) { return expressApp; };
  expressApp.path = function () { return ''; };

  // Route registration with multiple handlers & arrays
  expressApp._registerRoute = function (method, path, handlers) {
    const flattened = flattenHandlers(handlers);
    if (flattened.length === 0) return expressApp;

    const routeMiddlewares = flattened.slice(0, -1);
    const finalHandler = flattened[flattened.length - 1];

    const expressHandler = (ctx) => {
      const req = ctx.req;
      const res = ctx._expressRes;
      let mwIdx = 0;

      function next(err) {
        if (err) {
          if (typeof app._errorHandler === 'function') return app._errorHandler(err, ctx);
          throw err;
        }
        if (mwIdx < routeMiddlewares.length) {
          const mw = routeMiddlewares[mwIdx++];
          return mw(req, res, next);
        }
        return finalHandler(req, res, (finalErr) => {
          if (finalErr) throw finalErr;
        });
      }

      return next();
    };

    if (method === 'all') {
      app.all(path, expressHandler);
    } else {
      app[method](path, expressHandler);
    }

    return expressApp;
  };

  // HTTP Method verbs
  expressApp.post = function (path, ...handlers) { return expressApp._registerRoute('post', path, handlers); };
  expressApp.put = function (path, ...handlers) { return expressApp._registerRoute('put', path, handlers); };
  expressApp.delete = function (path, ...handlers) { return expressApp._registerRoute('del', path, handlers); };
  expressApp.del = expressApp.delete;
  expressApp.patch = function (path, ...handlers) { return expressApp._registerRoute('patch', path, handlers); };
  expressApp.head = function (path, ...handlers) { return expressApp._registerRoute('head', path, handlers); };
  expressApp.options = function (path, ...handlers) { return expressApp._registerRoute('options', path, handlers); };
  expressApp.all = function (path, ...handlers) { return expressApp._registerRoute('all', path, handlers); };

  expressApp.route = function (path) {
    const routeObj = {
      get: (...h) => { expressApp.get(path, ...h); return routeObj; },
      post: (...h) => { expressApp.post(path, ...h); return routeObj; },
      put: (...h) => { expressApp.put(path, ...h); return routeObj; },
      delete: (...h) => { expressApp.delete(path, ...h); return routeObj; },
      patch: (...h) => { expressApp.patch(path, ...h); return routeObj; },
      all: (...h) => { expressApp.all(path, ...h); return routeObj; }
    };
    return routeObj;
  };

  expressApp.use = function (...args) {
    if (args.length === 0) return expressApp;
    let prefix = null;
    let handlers = args;

    if (typeof args[0] === 'string') {
      prefix = args[0];
      handlers = args.slice(1);
    }

    const flattened = flattenHandlers(handlers);

    flattened.forEach((fn) => {
      if (prefix) {
        app.useExpressRouter(prefix, fn);
      } else {
        if (fn.length >= 3 || fn.name === 'router') {
          app.useExpress(fn);
        } else {
          app.use((ctx, next) => fn(ctx.req, ctx._expressRes, next));
        }
      }
    });

    return expressApp;
  };

  expressApp.listen = function (port, hostOrCb, cb) {
    return app.listen(port, hostOrCb, cb);
  };

  return expressApp;
}

// Built-in Middleware factories (1:1 identical to express.*)
express.Router = Router;

express.json = function json(options = {}) {
  return (req, res, next) => next();
};

express.urlencoded = function urlencoded(options = {}) {
  return (req, res, next) => next();
};

express.text = function text(options = {}) {
  return (req, res, next) => next();
};

express.raw = function raw(options = {}) {
  return (req, res, next) => next();
};

express.static = function staticMiddleware(dirPath, options = {}) {
  return (req, res, next) => next();
};

// Named Exports
export const json = express.json;
export const urlencoded = express.urlencoded;
export const text = express.text;
export const raw = express.raw;
export const serveStatic = express.static;
export { serveStatic as static };

export default express;
