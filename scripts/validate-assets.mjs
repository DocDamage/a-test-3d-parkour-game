#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { VISUAL_ASSET_MANIFEST } from '../js/VisualAssetRegistry.js';
import { AUDIO_ASSET_MANIFEST } from '../js/AudioAssetRegistry.js';

const repoRoot = resolve(import.meta.dirname, '..');
const missingRequired = [];
const missingOptional = [];

function checkEntries(kind, entries = {}) {
  for (const [id, def] of Object.entries(entries)) {
    if (!def?.path) continue;
    const path = resolve(repoRoot, def.path);
    if (existsSync(path)) continue;
    const record = `${kind}:${id} -> ${def.path}`;
    if (def.preload === true || def.required === true) missingRequired.push(record);
    else missingOptional.push(record);
  }
}

checkEntries('model', VISUAL_ASSET_MANIFEST.models);
checkEntries('texture', VISUAL_ASSET_MANIFEST.textures);
checkEntries('audio', AUDIO_ASSET_MANIFEST);

if (missingOptional.length > 0) {
  console.log(`Asset warnings: ${missingOptional.length} optional manifest path(s) are not present yet.`);
  for (const item of missingOptional.slice(0, 12)) console.log(`  WARN ${item}`);
  if (missingOptional.length > 12) console.log(`  ... ${missingOptional.length - 12} more optional missing asset(s)`);
}

if (missingRequired.length > 0) {
  console.error(`Asset validation failed: ${missingRequired.length} required/preload asset(s) missing.`);
  for (const item of missingRequired) console.error(`  FAIL ${item}`);
  process.exit(1);
}

console.log('Asset validation passed.');
