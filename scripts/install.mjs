#!/usr/bin/env node
// Builds the native N-API addon (bin/velociradix.node) when the package is
// installed from npm. Finds Node headers (repo copy, node-gyp cache, or a fresh
// download from nodejs.org) and runs `make NODE_INC=<headers> addon`.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const ver = process.version;   // "v22.19.0"
const verNoV = ver.slice(1);   // "22.19.0"

const hasHeader = (dir) => existsSync(path.join(dir, 'node_api.h'));

function findHeaders() {
  const candidates = [
    process.env.VELOCIRADIX_NODE_INC,
    path.join(root, 'deps', `node-${verNoV}`, 'include', 'node'),
    path.join(os.homedir(), '.node-gyp', verNoV, 'include', 'node'),
    path.join(os.homedir(), '.node-gyp', verNoV, `node-${ver}`, 'include', 'node'),
    path.join(os.homedir(), '.node-gyp', ver, 'include', 'node'),
  ].filter(Boolean);
  for (const c of candidates) if (hasHeader(c)) return c;
  return null;
}

async function downloadHeaders() {
  const cacheDir = path.join(os.homedir(), '.node-gyp', verNoV);
  const tgz = path.join(cacheDir, `node-${ver}-headers.tar.gz`);
  const url = `https://nodejs.org/download/release/${ver}/node-${ver}-headers.tar.gz`;
  mkdirSync(cacheDir, { recursive: true });
  console.log(`[velociradix] downloading Node headers: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`headers download failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(tgz, buf);
  rmSync(path.join(cacheDir, 'include'), { recursive: true, force: true });
  const r = spawnSync('tar', ['-xzf', path.basename(tgz)], { cwd: cacheDir, stdio: 'inherit' });
  rmSync(tgz, { force: true });
  if (r.status !== 0) throw new Error('failed to extract Node headers (need `tar`)');

  // Extracts as include/node/... on modern Node, or node-<ver>/include/node/...
  const direct = path.join(cacheDir, 'include', 'node');
  if (hasHeader(direct)) return direct;
  for (const dir of readdirSync(cacheDir)) {
    const nested = path.join(cacheDir, dir, 'include', 'node');
    if (hasHeader(nested)) return nested;
  }
  throw new Error('Node headers extracted, but node_api.h was not found');
}

function tryLoadPrebuilt() {
  const platform = os.platform();
  const arch = os.arch();
  const prebuiltPath = path.join(root, 'prebuilds', `${platform}-${arch}`, 'velociradix.node');
  const targetDir = path.join(root, 'bin');
  const targetPath = path.join(targetDir, 'velociradix.node');

  if (existsSync(prebuiltPath)) {
    mkdirSync(targetDir, { recursive: true });
    copyFileSync(prebuiltPath, targetPath);
    console.log(`[velociradix] loaded prebuilt native addon for ${platform}-${arch}`);
    return true;
  }
  return false;
}

async function main() {
  if (process.env.VELOCIRADIX_SKIP_BUILD) {
    console.log('[velociradix] skipping native build (VELOCIRADIX_SKIP_BUILD=1)');
    return;
  }

  if (tryLoadPrebuilt()) {
    return;
  }

  let headers = findHeaders();
  if (!headers) headers = await downloadHeaders();

  if (os.platform() === 'win32') {
    // Detect available compiler: clang++, g++ (MinGW), or cl.exe (MSVC)
    let compiler = 'clang++';
    if (spawnSync('clang++', ['--version'], { stdio: 'ignore' }).status !== 0) {
      if (spawnSync('g++', ['--version'], { stdio: 'ignore' }).status !== 0) {
        if (spawnSync('cl.exe', ['/?'], { stdio: 'ignore' }).status !== 0) {
          console.error('[velociradix] No C++17 compiler found. Install clang++, MinGW g++, or Visual Studio Build Tools.');
          throw new Error('No C++17 compiler found');
        }
        compiler = 'cl.exe';
      } else {
        compiler = 'g++';
      }
    }
    console.log(`[velociradix] Compiling for Windows with ${compiler}...`);
    mkdirSync(path.join(root, 'obj'), { recursive: true });
    mkdirSync(path.join(root, 'bin'), { recursive: true });
    
    // Download node.lib
    const cacheDir = path.join(os.homedir(), '.node-gyp', verNoV);
    const nodeLibPath = path.join(cacheDir, 'node.lib');
    if (!existsSync(nodeLibPath)) {
      const libUrl = `https://nodejs.org/download/release/${ver}/win-x64/node.lib`;
      console.log(`[velociradix] downloading ${libUrl}`);
      const res = await fetch(libUrl);
      if (!res.ok) throw new Error(`node.lib download failed: HTTP ${res.status}`);
      writeFileSync(nodeLibPath, Buffer.from(await res.arrayBuffer()));
    }

    const normHeaders = headers.replaceAll('\\', '/');
    const normNodeLib = nodeLibPath.replaceAll('\\', '/');

    if (compiler === 'cl.exe') {
      const c1 = spawnSync('cl.exe', [
        '/std:c++17', '/O2', '/EHsc', '/I', 'src',
        '/c', '/Fo:obj/velociradix.o', 'src/velociradix.cpp'
      ], { cwd: root, stdio: 'inherit' });
      if (c1.status !== 0) throw new Error(`velociradix: cl.exe compile step 1 failed (exit ${c1.status})`);

      const c2 = spawnSync('cl.exe', [
        '/std:c++17', '/O2', '/EHsc', '/I', 'src', '/I', normHeaders,
        '/c', '/Fo:obj/addon.o', 'src/addon.cpp'
      ], { cwd: root, stdio: 'inherit' });
      if (c2.status !== 0) throw new Error(`velociradix: cl.exe compile step 2 failed (exit ${c2.status})`);

      const c3 = spawnSync('cl.exe', [
        '/LD', '/Fe:bin/velociradix.node',
        'obj/velociradix.o', 'obj/addon.o', normNodeLib, 'ws2_32.lib'
      ], { cwd: root, stdio: 'inherit' });
      if (c3.status !== 0) throw new Error(`velociradix: cl.exe link failed (exit ${c3.status})`);
    } else {
      const c1 = spawnSync(compiler, [
        '-std=c++17', '-O3', '-Wall', '-Wextra', '-I', 'src',
        '-c', '-o', 'obj/velociradix.o', 'src/velociradix.cpp'
      ], { cwd: root, stdio: 'inherit' });
      if (c1.status !== 0) throw new Error(`velociradix: ${compiler} compile step 1 failed (exit ${c1.status})`);

      const c2 = spawnSync(compiler, [
        '-std=c++17', '-O3', '-Wall', '-Wextra', '-I', 'src', '-I', normHeaders,
        '-c', '-o', 'obj/addon.o', 'src/addon.cpp'
      ], { cwd: root, stdio: 'inherit' });
      if (c2.status !== 0) throw new Error(`velociradix: ${compiler} compile step 2 failed (exit ${c2.status})`);

      const c3 = spawnSync(compiler, [
        '-shared', '-o', 'bin/velociradix.node',
        'obj/velociradix.o', 'obj/addon.o', normNodeLib, '-lws2_32'
      ], { cwd: root, stdio: 'inherit' });
      if (c3.status !== 0) throw new Error(`velociradix: ${compiler} link failed (exit ${c3.status})`);
    }

    console.log('[velociradix] native addon built OK');
    return;
  }

  const hasClang = spawnSync('clang++', ['--version'], { stdio: 'ignore' }).status === 0;
  const compilerFlag = hasClang ? '' : 'CXX=g++';
  const r = spawnSync('make', ['-B', compilerFlag, `NODE_INC=${headers}`, 'addon'].filter(Boolean), {
    cwd: root,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.error('[velociradix] native build failed. A C++17 compiler (clang++/g++) is required.');
    throw new Error(`velociradix: make failed (exit ${r.status})`);
  }
  console.log('[velociradix] native addon built OK');
}

main().catch((e) => {
  console.error('[velociradix] build failed:', e.message);
  process.exitCode = 1;
});
