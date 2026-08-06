// Addon-server used by bench-addon.mjs: runs the C++ engine via the JS facade.
// Usage: node bench/addon-server.mjs [port] [workers]
import { app } from '../index.mjs';

const port = process.argv[2] ? Number(process.argv[2]) : 9092;
const workers = process.argv[3] ? Number(process.argv[3]) : 0;

app
  .setWorkers(workers)
  .get('/json', () => ({ hello: 'world' }))
  .get('/plain', (ctx) => ctx.send('Hello from velociradix (pure C++ engine)'))
  .listen(port, '127.0.0.1');
