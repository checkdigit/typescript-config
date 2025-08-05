// test/typescript/typescript-5.9.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

// "import defer" not currently supported in Node
import /* defer */ * as deferredModule from './typescript-5.9-defer.test.ts';

describe('typescript-5.9', () => {
  it('supports import defer', () => {
    // This test is to ensure that the `import defer` syntax works correctly.
    // assert.equal(globalThis.sideEffect, undefined);
    assert.equal(deferredModule.thing, 3);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    assert.equal(globalThis.sideEffect, 123);
  });
});
