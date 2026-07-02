// test/lib/es2026.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('es2027', () => {
  // https://github.com/tc39/proposal-temporal
  if (process.version < 'v26') {
    // Node 24
    it('does not support Temporal yet', () => {
      // compiles, but unfortunately, Node.js does not support yet
      assert.throws(() => Temporal.Now.instant(), {
        name: 'ReferenceError',
        message: 'Temporal is not defined',
      });
    });
  } else {
    // Node 26+
    it('supports Temporal', () => {
      assert.equal(
        Temporal.ZonedDateTime.from('2026-05-05T12:00:00[America/New_York]')
          .toInstant()
          .toString(),
        '2026-05-05T16:00:00Z',
      );
    });
  }

  // https://github.com/tc39/proposal-joint-iteration
  it('does not support Joint Iteration yet', () => {
    assert.throws(
      () =>
        assert.deepEqual(
          // @ts-expect-error not supported by TypeScript 6/7
          Iterator.zip([
            [0, 1, 2],
            [3, 4, 5],
          ]).toArray(),
          [
            [0, 3],
            [1, 4],
            [2, 5],
          ],
        ),
      { message: 'Iterator.zip is not a function' },
    );
    assert.throws(
      () =>
        assert.deepEqual(
          // @ts-expect-error not supported by TypeScript 6/7
          Iterator.zipKeyed({
            a: [0, 1, 2],
            b: [3, 4, 5, 6],
            c: [7, 8, 9],
          }).toArray(),
          [
            { a: 0, b: 3, c: 7 },
            { a: 1, b: 4, c: 8 },
            { a: 2, b: 5, c: 9 },
          ],
        ),
      { message: 'Iterator.zipKeyed is not a function' },
    );
  });

  // https://github.com/tc39/proposal-atomics-microwait
  it('supports Atomics.pause()', async () => {
    Atomics.pause();
  });

  // https://github.com/tc39/proposal-explicit-resource-management
  it('supports Explicit Resource Management', async () => {
    let disposedSync = false;
    function maybeThrowAnErrorSync(error: boolean) {
      using disposable = {
        [Symbol.dispose]() {
          disposedSync = true;
        },
      };
      assert.ok(typeof disposable === 'object');
      if (error) {
        throw new Error('oops');
      }
    }
    maybeThrowAnErrorSync(false);
    assert.equal(disposedSync, true);
    disposedSync = false;
    assert.throws(() => maybeThrowAnErrorSync(true));
    assert.equal(disposedSync, true);

    let disposedAsync = false;
    async function maybeThrowAnErrorAsync(error: boolean) {
      await using disposable = {
        async [Symbol.asyncDispose]() {
          disposedAsync = true;
        },
      };
      assert.ok(typeof disposable === 'object');
      if (error) {
        throw new Error('oops');
      }
    }
    await maybeThrowAnErrorAsync(false);
    assert.equal(disposedAsync, true);
    disposedAsync = false;
    await assert.rejects(() => maybeThrowAnErrorAsync(true));
    assert.equal(disposedAsync, true);
  });
});
