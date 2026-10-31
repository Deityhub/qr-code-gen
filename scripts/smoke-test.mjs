// Loads the built package through both module systems, the way consumers do.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const esm = await import('@deityhub/qr-code-gen');
const cjs = require('@deityhub/qr-code-gen');

for (const [name, lib] of [['import', esm], ['require', cjs]]) {
    const svg = lib.renderToSVG(lib.generateQRCode({ data: 'smoke test' }), 100);
    assert.ok(svg.startsWith('<svg'), `${name}: renderToSVG returned no svg`);
}
assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm).sort(), 'ESM and CJS exports differ');
console.log('package smoke test passed');
