// test/node/node-24.spec.ts

import { strict as assert } from 'node:assert';
import crypto from 'node:crypto';
import { describe, it } from 'node:test';
import tls from 'node:tls';

describe('node-24', () => {
  it('URLPattern exists as a global', async () => {
    assert.equal(typeof URLPattern, 'function');
  });

  // 24.2+
  it('import.meta.main is available', async () => {
    assert.ok(typeof import.meta.main === 'boolean');
  });

  // 24.5+
  it('Built-in proxy support in request() and Agent', async () => {
    tls.setDefaultCACertificates(
      tls.getCACertificates('default').concat(tls.getCACertificates('system')),
    );
  });

  // 24.7+
  it('Post-Quantum Cryptography in node:crypto', async () => {
    assert.equal(typeof crypto.encapsulate, 'function');
    assert.equal(typeof crypto.decapsulate, 'function');
  });

  // 24.11+
  if (process.version.startsWith('v24')) {
    // Node 24
    it('Long Term Support (LTS)', async () => {
      assert.equal(process.release.lts, 'Krypton');
    });
  }
});
