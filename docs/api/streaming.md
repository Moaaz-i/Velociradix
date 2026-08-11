# Response & Streaming API

Velociradix supports high-performance response streaming and Server-Sent Events (SSE).

---

## 1. Server-Sent Events (SSE) Streaming (`ctx.sse()`)

```js
app.get('/live-stream', (ctx) => {
  ctx.sse((stream) => {
    stream.send_event({ message: 'Connected' }, 'init');

    let counter = 0;
    const interval = setInterval(() => {
      stream.send_event({ tick: ++counter }, 'update');

      if (counter >= 10) {
        clearInterval(interval);
        stream.close();
      }
    }, 1000);
  });
});
```

---

## 2. Node.js Stream Piping (`ctx.sendStream()`)

Pipe any Readable stream directly to the response:

```js
import { createReadStream } from 'node:fs';

app.get('/download-large-log', async (ctx) => {
  const stream = createReadStream('./app.log');
  await ctx.sendStream(stream, 'text/plain');
});
```

---

## 3. File Serving & Range Requests (`ctx.sendFile()`)

Supports ETag calculation, `304 Not Modified`, and `HTTP 206 Partial Content` Range Requests for video/audio streaming:

```js
app.get('/media/video.mp4', (ctx) => {
  return ctx.sendFile('./assets/video.mp4');
});
```
