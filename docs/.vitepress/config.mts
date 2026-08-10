import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Velociradix',
  description: 'Zero-dependency, ultra-fast C++17 HTTP engine & Node.js framework',
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/context' },
      { text: 'Architecture', link: '/architecture' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/guide/getting-started' },
          { text: 'Features Overview', link: '/guide/features' },
          { text: 'Performance & Benchmarks', link: '/guide/benchmarks' },
        ],
      },
      {
        text: 'Middlewares & Security',
        items: [
          { text: 'Built-in Middlewares', link: '/guide/middlewares' },
          { text: 'Schema & Zod Validation', link: '/guide/validation' },
          { text: 'JWT & Crypto Security', link: '/guide/security' },
        ],
      },
      {
        text: 'API Documentation',
        items: [
          { text: 'Application (`app`)', link: '/api/app' },
          { text: 'Context (`ctx`)', link: '/api/context' },
          { text: 'Response & Streaming', link: '/api/streaming' },
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
