import velociradix, {
  app,
  createApp,
  Context,
  Request,
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
  logger,
  cors,
  bearerAuth,
  jwtAuth,
  compress,
  csrf,
  cache,
  requestId,
  validate,
  sanitize,
  session,
  slowDown,
  rateLimit,
  helmet,
  ipFilter,
  responseTime,
  sizeLimit,
  maintenance,
  basicAuth,
  csp,
  timeout,
  methodOverride,
  apiKey,
  allowedMethods,
  headerInjector,
  redirector,
  concurrencyLimit,
  etag,
  userAgentBlocker,
  bodyCleaner,
  conditionalRequest,
  hostGuard,
  auditLog,
  favicon,
  circuitBreaker,
  rateLimitByKey,
  App,
  RouteGroup,
  Middleware,
  Handler,
  JsonObject,
  JsonValue,
} from '../index.mjs';

import express, { ExpressApp, ExpressRequest, ExpressResponse } from '../express.mjs';

const customApp: App = createApp();
customApp.get('/test', (ctx: Context) => {
  const req: Request = ctx.req;
  const method: string = req.method;
  const ip: string = ctx.ip;
  ctx.setHeader('X-Test', '1');
  return ctx.json({ method, ip });
});

customApp.group('/api', (g: RouteGroup) => {
  g.use((ctx, next) => next());
  g.get('/v1', (ctx) => ({ status: 'ok' }));
});

const exp: ExpressApp = express();
exp.get('/express', (req: ExpressRequest, res: ExpressResponse) => {
  res.status(200).send('express ok');
});

customApp.autoRoute('./routes');
const routePromise: Promise<App> = customApp.autoRouteAsync('./routes', '/api');

