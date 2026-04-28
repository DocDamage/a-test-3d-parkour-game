#!/usr/bin/env node
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import net from 'node:net';

const repoRoot = resolve(import.meta.dirname, '..');
const optional = process.argv.includes('--optional');
const mime = new Map([
  ['.html', 'text/html'], ['.js', 'text/javascript'], ['.css', 'text/css'],
  ['.json', 'application/json'], ['.png', 'image/png'], ['.svg', 'image/svg+xml']
]);

function findBrowser() {
  const env = process.env.CHROME || process.env.CHROME_PATH || process.env.EDGE_PATH;
  const candidates = [
    env,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'
  ].filter(Boolean);
  return candidates.find(existsSync);
}

function getFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
    server.on('error', reject);
  });
}

function startStaticServer() {
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const file = resolve(repoRoot, `.${requested}`);
    if (!file.startsWith(repoRoot) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime.get(extname(file)) || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolveServer, reject) => {
    server.listen(0, '127.0.0.1', () => resolveServer(server));
    server.on('error', reject);
  });
}

function delay(ms) {
  return new Promise(resolveDelay => setTimeout(resolveDelay, ms));
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.exceptions = [];
    this.requests = new Map();
    this.networkFailures = [];
    ws.addEventListener('message', event => this._onMessage(event.data));
  }

  _onMessage(data) {
    const msg = JSON.parse(data);
    if (msg.id && this.pending.has(msg.id)) {
      this.pending.get(msg.id)(msg);
      this.pending.delete(msg.id);
    }
    if (msg.method === 'Runtime.exceptionThrown') this.exceptions.push(msg.params.exceptionDetails);
    if (msg.method === 'Network.requestWillBeSent') {
      this.requests.set(msg.params.requestId, msg.params.request?.url || '');
    }
    if (msg.method === 'Network.loadingFailed') {
      this.networkFailures.push({
        url: this.requests.get(msg.params.requestId) || msg.params.requestId,
        errorText: msg.params.errorText,
        type: msg.params.type
      });
    }
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise(resolveSend => this.pending.set(id, resolveSend));
  }
}

async function main() {
  if (typeof WebSocket === 'undefined') {
    throw new Error('Node WebSocket global is unavailable; use Node 22+ for browser smoke tests.');
  }

  const browser = findBrowser();
  if (!browser) {
    const message = 'Browser smoke skipped: Chrome/Edge executable not found.';
    if (optional) {
      console.log(message);
      return;
    }
    throw new Error(message);
  }

  const staticServer = await startStaticServer();
  const appPort = staticServer.address().port;
  const debugPort = await getFreePort();
  const profile = mkdtempSync(join(tmpdir(), 'vp-arpg-smoke-'));
  const browserProcess = spawn(browser, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profile}`,
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    let target;
    for (let i = 0; i < 40; i++) {
      try {
        target = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
        break;
      } catch {
        await delay(250);
      }
    }
    if (!target?.webSocketDebuggerUrl) throw new Error('Could not open Chrome DevTools target.');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolveOpen, rejectOpen) => {
      ws.addEventListener('open', resolveOpen, { once: true });
      ws.addEventListener('error', rejectOpen, { once: true });
    });
    const cdp = new Cdp(ws);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__smokeErrors = [];
        window.addEventListener('error', e => window.__smokeErrors.push(String(e.message || e.error || e)));
        window.addEventListener('unhandledrejection', e => window.__smokeErrors.push('unhandled: ' + String(e.reason && (e.reason.message || e.reason) || e.reason)));
        localStorage.setItem('runner_name', 'Smoke');
        localStorage.setItem('rpg_origin', 'Street Samurai');
        localStorage.setItem('rpg_archetype', 'Ronin');
        localStorage.setItem('apex_character', 'Kira');
        localStorage.setItem('apex_gems', JSON.stringify({ ruby: 2, diamond: 1 }));
        localStorage.setItem('apex_inventory_stash', JSON.stringify([
          {
            id: 'smoke_legendary_helmet',
            name: 'Unidentified Helmet',
            rarity: 4,
            slot: 'helmet',
            unidentified: true,
            identified: false,
            baseStats: { armor: 12 },
            affixes: [{ name: 'Brutal', stat: 'damageMultiplier', value: 0.08 }],
            sockets: 2,
            gems: [{ id: 'ruby', name: 'Ruby', color: '#ff3355', bonuses: { meleeDamage: 0.05, damageMultiplier: 0.03 } }]
          },
          {
            id: 'smoke_rare_boots',
            name: 'Smoke-Test Boots',
            rarity: 3,
            slot: 'boots',
            unidentified: false,
            identified: true,
            baseStats: { moveSpeed: 0.04 },
            affixes: [{ name: 'Swift', stat: 'moveSpeed', value: 0.06 }],
            sockets: 1,
            gems: []
          }
        ]));
      `
    });
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${appPort}/index.html?smoke=${Date.now()}` });
    await delay(5000);
    await cdp.send('Runtime.evaluate', { expression: "document.getElementById('start-screen')?.click(); true", returnByValue: true });
    await delay(4000);
    const result = await cdp.send('Runtime.evaluate', {
      expression: "({ gameStarted: window.gameStarted, ui: document.getElementById('ui')?.style.display, errors: window.__smokeErrors || [] })",
      returnByValue: true
    });
    const value = result.result?.result?.value || {};
    const benignAbortedAssets = cdp.networkFailures.filter(f =>
      f.errorText === 'net::ERR_ABORTED' &&
      /\.(glb|gltf|png|ogg)(\?|$)/i.test(f.url || '')
    );
    const hasOnlyBenignNetworkErrors = benignAbortedAssets.length > 0 &&
      benignAbortedAssets.length === cdp.networkFailures.length;
    const rawErrors = [...(value.errors || []), ...cdp.exceptions.map(e => e.exception?.description || e.text)];
    const errors = hasOnlyBenignNetworkErrors
      ? rawErrors.filter(err => !/^(unhandled: )?(TypeError: )?network error$/i.test(String(err)))
      : rawErrors;
    if (!value.gameStarted || value.ui !== 'block' || errors.length > 0) {
      throw new Error(`Browser smoke failed: ${JSON.stringify({ value, errors: errors.slice(0, 3), networkFailures: cdp.networkFailures.slice(0, 5) })}`);
    }
    await cdp.send('Runtime.evaluate', {
      expression: "document.getElementById('stash-panel').style.display = 'block'; document.getElementById('safehouse-panel').style.display = 'block'; true",
      returnByValue: true
    });
    await delay(1000);
    const scenario = await cdp.send('Runtime.evaluate', {
      expression: `({
        stashItems: document.querySelectorAll('#stash-list .stash-item').length,
        compareRows: document.querySelectorAll('#stash-list .stash-compare').length,
        socketButtons: document.querySelectorAll('#stash-list .stash-socket').length,
        unsocketButtons: document.querySelectorAll('#stash-list .stash-unsocket').length,
        identifyBench: document.getElementById('safehouse-identify-status')?.textContent || '',
        identifyButton: document.getElementById('btn-safehouse-identify-all')?.textContent || ''
      })`,
      returnByValue: true
    });
    const scenarioValue = scenario.result?.result?.value || {};
    if (
      scenarioValue.stashItems < 2 ||
      scenarioValue.compareRows < 2 ||
      scenarioValue.socketButtons < 1 ||
      scenarioValue.unsocketButtons < 1 ||
      !scenarioValue.identifyBench.includes('unidentified') ||
      !scenarioValue.identifyButton.includes('Identify')
    ) {
      throw new Error(`Browser scenario smoke failed: ${JSON.stringify(scenarioValue)}`);
    }
    ws.close();
    console.log(`Browser smoke passed on http://127.0.0.1:${appPort}/index.html`);
  } finally {
    staticServer.close();
    browserProcess.kill();
  }
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
