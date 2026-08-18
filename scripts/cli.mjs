#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const command = args[0];

console.log('\n⚡ \x1b[36mVelociradix CLI Tool\x1b[0m — Ultra-Fast C++ Powered Node.js Engine\n');

if (!command || command === '--help' || command === '-h' || command === 'help') {
  console.log('Usage:');
  console.log('  npx create-velociradix-app <project-name> [--template ts|js|express-bridge|rest-api]');
  console.log('  npx velociradix init\n');
  console.log('Templates:');
  console.log('  js              - Clean JavaScript ES Modules starter (Default)');
  console.log('  ts              - Strict TypeScript starter with types');
  console.log('  express-bridge  - Express Router & Middleware compatibility starter');
  console.log('  rest-api        - Full REST API with JWT Auth, Postman UI, & Zod Validation\n');
  process.exit(0);
}

let projectName = command;
let template = 'js';

const templateIdx = args.indexOf('--template');
if (templateIdx !== -1 && args[templateIdx + 1]) {
  template = args[templateIdx + 1].toLowerCase();
} else if (projectName === 'init') {
  projectName = '.';
}

const targetDir = resolve(process.cwd(), projectName);

if (existsSync(targetDir) && projectName !== '.') {
  console.error(`\x1b[31mError:\x1b[0m Directory "${projectName}" already exists.`);
  process.exit(1);
}

if (projectName !== '.') {
  mkdirSync(targetDir, { recursive: true });
}

console.log(`🚀 Creating new \x1b[32mVelociradix (${template.toUpperCase()})\x1b[0m project in \x1b[33m${targetDir}\x1b[0m...\n`);

// 1. package.json Template
const isTs = template === 'ts';
const packageJson = {
  name: projectName === '.' ? 'velociradix-app' : projectName,
  version: '1.0.0',
  type: 'module',
  scripts: {
    start: isTs ? 'tsc && node dist/index.js' : 'node index.mjs',
    dev: isTs ? 'tsc --watch' : 'node --watch index.mjs'
  },
  dependencies: {
    velociradix: '^8.0.0'
  },
  devDependencies: isTs ? {
    typescript: '^5.0.0',
    '@types/node': '^20.0.0'
  } : {}
};

writeFileSync(join(targetDir, 'package.json'), JSON.stringify(packageJson, null, 2));

// 2. tsconfig.json (if TypeScript)
if (isTs) {
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      experimentalDecorators: true,
      skipLibCheck: true
    },
    include: ['src/**/*']
  };
  mkdirSync(join(targetDir, 'src'), { recursive: true });
  writeFileSync(join(targetDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
}

// 3. Index Application File Templates
let appCode = '';

if (template === 'express-bridge') {
  appCode = `import { createApp } from 'velociradix';
import morgan from 'morgan';
import cors from 'cors';

const app = createApp();

// Wrap standard Express middlewares with 100% compatibility
app.useExpress(morgan('dev'));
app.useExpress(cors());

app.get('/', (ctx) => {
  return { 
    message: '⚡ High Performance Velociradix Engine with Express Middlewares',
    engine: 'C++17 Event Loop (kqueue/epoll)',
    latency: '< 1ms'
  };
});

app.listen(3000, () => {
  console.log('⚡ Server running at http://localhost:3000');
});
`;
} else if (template === 'rest-api') {
  appCode = `import { createApp, logger, helmet, cors, jwtAuth } from 'velociradix';

const app = createApp();

app.use(logger());
app.use(helmet());
app.use(cors());

// Interactive Postman Docs
app.postmanDoc('/postman-docs', {
  name: 'Velociradix REST API Starter',
  description: 'Ultra-fast REST API endpoints generated with Postman UI'
});

// Authentication
app.post('/api/login', (ctx) => {
  const token = ctx.jwtSign({ userId: 1, role: 'admin' }, 'secret-key', { expiresIn: 3600 });
  return { status: 'success', token };
});

// Protected Route
app.get('/api/users/profile', (ctx) => {
  return { status: 'success', user: ctx.state.user };
}, { middlewares: [jwtAuth({ secret: 'secret-key' })] });

app.listen(3000, () => {
  console.log('⚡ REST API Running at http://localhost:3000');
  console.log('📋 Interactive Postman Docs: http://localhost:3000/postman-docs');
});
`;
} else if (isTs) {
  appCode = `import velociradix, { Context } from 'velociradix';

const app = velociradix();

app.get('/', (ctx: Context) => {
  return { message: '⚡ Hello from Velociradix TypeScript Starter!' };
});

app.get('/users/:id', (ctx: Context) => {
  return { id: ctx.params.id, query: ctx.query() };
});

app.listen(3000, () => {
  console.log('⚡ Server running at http://localhost:3000');
});
`;
} else {
  // Default JS
  appCode = `import { createApp, logger } from 'velociradix';

const app = createApp();

app.use(logger());

app.get('/', (ctx) => {
  return { message: '⚡ Hello from Velociradix Ultra-Fast Engine!' };
});

app.get('/hello/:name', (ctx) => {
  return { greeting: \`Hello, \${ctx.params.name}!\` };
});

app.listen(3000, () => {
  console.log('⚡ Server running at http://localhost:3000');
});
`;
}

const mainFilePath = isTs ? join(targetDir, 'src', 'index.ts') : join(targetDir, 'index.mjs');
writeFileSync(mainFilePath, appCode);

// 4. .gitignore
writeFileSync(join(targetDir, '.gitignore'), `node_modules/\ndist/\n.env\n`);

// 5. README.md
writeFileSync(join(targetDir, 'README.md'), `# ${projectName}

Built with [Velociradix](https://github.com/Moaaz-i/Velociradix) — Zero-dependency C++ powered Node.js Web Engine.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`
`);

console.log('✨ Project created successfully!\n');
console.log('Next steps:');
if (projectName !== '.') {
  console.log(`  \x1b[36mcd ${projectName}\x1b[0m`);
}
console.log('  \x1b[36mnpm install\x1b[0m');
console.log('  \x1b[36mnpm run dev\x1b[0m\n');
