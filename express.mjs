import { createApp } from './index.mjs';

export function express() {
  const app = createApp();

  // Mount express compatibility bridge for all requests
  app.useExpress((req, res, next) => next());

  // Express style helper methods
  const expressApp = function (req, res, next) {
    if (typeof next === 'function') {
      return app.useExpress(expressApp)(req, res, next);
    }
  };

  Object.assign(expressApp, app);

  expressApp.use = function (...args) {
    if (args.length === 1 && typeof args[0] === 'function') {
      const fn = args[0];
      if (fn.length >= 3) {
        app.useExpress(fn);
      } else {
        app.use(fn);
      }
    } else if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'function') {
      const [prefix, fn] = args;
      if (fn.length >= 3 || fn.name === 'router') {
        app.useExpressRouter(prefix, fn);
      } else {
        app.use((ctx, next) => {
          if (ctx.req.path.startsWith(prefix)) {
            return fn(ctx, next);
          }
          return next();
        });
      }
    } else {
      args.forEach(arg => {
        if (typeof arg === 'function') {
          if (arg.length >= 3) app.useExpress(arg);
          else app.use(arg);
        }
      });
    }
    return expressApp;
  };

  const createExpressRouteHandler = (handler) => (ctx) => {
    const req = ctx.req;
    const res = ctx._expressRes;
    if (handler.length >= 2 || res) {
      return handler(req, res, (err) => {
        if (err) throw err;
      });
    }
    return handler(ctx);
  };

  expressApp.get = function (path, ...handlers) {
    if (handlers.length === 0) return app.get ? app.get(path) : undefined;
    const handler = handlers.pop();
    handlers.forEach(h => expressApp.use(h));
    app.get(path, createExpressRouteHandler(handler));
    return expressApp;
  };

  expressApp.post = function (path, ...handlers) {
    const handler = handlers.pop();
    handlers.forEach(h => expressApp.use(h));
    app.post(path, createExpressRouteHandler(handler));
    return expressApp;
  };

  expressApp.put = function (path, ...handlers) {
    const handler = handlers.pop();
    handlers.forEach(h => expressApp.use(h));
    app.put(path, createExpressRouteHandler(handler));
    return expressApp;
  };

  expressApp.delete = function (path, ...handlers) {
    const handler = handlers.pop();
    handlers.forEach(h => expressApp.use(h));
    app.del(path, createExpressRouteHandler(handler));
    return expressApp;
  };

  expressApp.patch = function (path, ...handlers) {
    const handler = handlers.pop();
    handlers.forEach(h => expressApp.use(h));
    app.patch(path, createExpressRouteHandler(handler));
    return expressApp;
  };

  expressApp.head = function (path, ...handlers) {
    const handler = handlers.pop();
    handlers.forEach(h => expressApp.use(h));
    app.head(path, createExpressRouteHandler(handler));
    return expressApp;
  };

  expressApp.options = function (path, ...handlers) {
    const handler = handlers.pop();
    handlers.forEach(h => expressApp.use(h));
    app.options(path, createExpressRouteHandler(handler));
    return expressApp;
  };

  expressApp.all = function (path, ...handlers) {
    const handler = handlers.pop();
    handlers.forEach(h => expressApp.use(h));
    app.all(path, createExpressRouteHandler(handler));
    return expressApp;
  };

  expressApp.listen = function (port, hostOrCb, cb) {
    return app.listen(port, hostOrCb, cb);
  };

  return expressApp;
}

// Router factory
express.Router = function Router(options = {}) {
  const routes = [];
  const routerFn = function (req, res, next) {
    let index = 0;
    function nextRoute() {
      if (index >= routes.length) return next();
      const r = routes[index++];
      if (r.method && req.method.toLowerCase() !== r.method) return nextRoute();
      if (r.path && req.url !== r.path && !req.url.startsWith(r.path)) return nextRoute();
      return r.handler(req, res, nextRoute);
    }
    return nextRoute();
  };

  routerFn.get = (path, handler) => { routes.push({ method: 'get', path, handler }); return routerFn; };
  routerFn.post = (path, handler) => { routes.push({ method: 'post', path, handler }); return routerFn; };
  routerFn.put = (path, handler) => { routes.push({ method: 'put', path, handler }); return routerFn; };
  routerFn.delete = (path, handler) => { routes.push({ method: 'delete', path, handler }); return routerFn; };
  routerFn.use = (handler) => { routes.push({ method: null, path: null, handler }); return routerFn; };

  return routerFn;
};

// Express builtin middleware stubs
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

export default express;
