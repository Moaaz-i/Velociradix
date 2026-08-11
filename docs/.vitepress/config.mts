import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Velociradix',
  description: 'Zero-dependency, ultra-fast C++17 HTTP engine & Node.js framework',
  base: '/Velociradix/',
  themeConfig: {
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Middlewares', link: '/guide/middlewares' },
      { text: 'API Reference', link: '/api/app' },
      { text: 'Tools & Testing', link: '/guide/postman-swagger' },
    ],
    sidebar: [
      {
        text: '📖 Core Guide',
        items: [
          { text: 'Introduction & Setup', link: '/guide/getting-started' },
          { text: 'Features Overview', link: '/guide/features' },
          { text: 'Routing & Path Params', link: '/guide/routing' },
          { text: 'Performance & Benchmarks', link: '/guide/benchmarks' },
        ],
      },
      {
        text: '⚙️ Middlewares & Validation',
        items: [
          { text: '20+ Built-in Middlewares', link: '/guide/middlewares' },
          { text: 'Building Custom Middlewares', link: '/guide/custom-middlewares' },
          { text: 'Schema & Zod Validation', link: '/guide/validation' },
          { text: 'Express Middleware Shim', link: '/guide/express-compat' },
        ],
      },
      {
        text: '🔒 Security & Auth',
        items: [
          { text: 'JWT, Auth & Encryption', link: '/guide/security' },
        ],
      },
      {
        text: '🛠️ Documentation & Tools',
        items: [
          { text: 'Postman & Swagger UI', link: '/guide/postman-swagger' },
          { text: 'Troubleshooting & FAQ', link: '/guide/troubleshooting' },
        ],
      },
      {
        text: '⚡ API Reference',
        items: [
          { text: 'Application Instance (`app`)', link: '/api/app' },
          { text: 'Context (`ctx`) & Request', link: '/api/context' },
          { text: 'Response & Streaming (`SSE`)', link: '/api/streaming' },
          { text: 'Fast-Path C++ Routes', link: '/api/fast-path' },
          { text: 'HTTP Error Classes', link: '/api/errors' },
        ],
      },
      {
        text: '🔬 Architecture & Internals',
        items: [
          { text: 'C++17 Engine Deep-Dive', link: '/architecture' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Moaaz-i/Velociradix' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/velociradix' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 moaaz yahia zakaria',
    },
  },
});
