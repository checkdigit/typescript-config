// test/typescript/typescript-6.0.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { Temporal as temporalPolyfill } from '@js-temporal/polyfill';

describe('typescript-6.0', () => {
  it('typing works with @js-temporal/polyfill', () => {
    assert.equal(typeof temporalPolyfill.Now.instant, 'function');
  });

  it('less context-Sensitivity on this-less functions', () => {
    function callIt<T>(obj: {
      produce: (x: number) => T;
      consume: (y: T) => void;
    }) {
      obj.consume(obj.produce(1));
    }

    // Works fine, `x` is inferred to be a number.
    callIt({
      produce(x: number) {
        return x * 2;
      },
      consume(y) {
        return y.toFixed();
      },
    });

    assert.equal(
      callIt({
        consume(y) {
          // previously an error < 6.0: 'y' is of type 'unknown'.
          return y.toFixed();
        },
        produce(x: number) {
          return x * 2;
        },
      }),
      undefined,
    );
  });
});
