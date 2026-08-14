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

import express, { ExpressApp, ExpressRequest, ExpressResponse, Router, json, urlencoded } from '../express.mjs';

const namedRouter = Router();
namedRouter.get('/users', (req: ExpressRequest, res: ExpressResponse) => {
  res.json({ ok: true });
});


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

// EventBus test
const bus = velociradix.createEventBus();
bus.on('user.*', (payload, meta) => {
  console.log(payload, meta.event);
});
bus.emit('user.created', { id: 1 });

customApp.onEvent('order.*', (data) => console.log(data));
customApp.emitEvent('order.placed', { orderId: '123' });

// Client test
import { createClient } from '../client.mjs';
const api = createClient('http://localhost:3000');
const clientPromise = api.users['123'].get();

// Decorators test
import { Controller, Get, Post, Body, Param, Query, registerController } from '../decorators.mjs';

@Controller('/items')
class ItemController {
  @Get('/:id')
  getItem(@Param('id') id: string) {
    return { id };
  }

  @Post('/')
  createItem(@Body() body: any) {
    return { created: true, body };
  }
}

customApp.registerController(ItemController);
registerController(customApp, ItemController);


