// typescript-5.0-esm.spec.mts

import { strict as assert } from 'node:assert';

import getPort from 'get-port'; // ESM version of get-port
import debug from 'debug';

describe('typescript-5.0 ESM', () => {
  it('"this" is undefined', () => {
    assert.ok(typeof this === 'undefined');
  });

  it('works with CJS modules', async () => {
    assert.ok(typeof debug === 'function');
    const log = debug('typescript-5.0-esm.spec.mts:test');
    assert.ok(typeof log === 'function');
    log.enabled = true;
    log('hello');
    debug.enable('typescript-5.0-esm.spec.mts:test');
    assert.ok(!debug.enabled('test'));
    assert.ok(debug.enabled('typescript-5.0-esm.spec.mts:test'));
  });

  it('works with ESM modules', async () => {
    assert.equal(typeof (await getPort()), 'number');
  });
});
