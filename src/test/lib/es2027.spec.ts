// test/lib/es2027.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('es2027', () => {
  // https://github.com/tc39/proposal-iterator-chunking
  it('does not support Iterator.chunks() yet', () => {
    assert.throws(() => [1, 2, 3].values().chunks(2), {
      name: 'TypeError',
    });
  });

  // https://github.com/tc39/proposal-iterator-includes
  it(
    'does not support Iterator.includes() yet',
    { skip: process.version >= 'v27' },
    () => {
      assert.throws(() => [1, 2, 3].values().includes(2), {
        name: 'TypeError',
      });
    },
  );

  it('supports Iterator.includes()', { skip: process.version < 'v27' }, () => {
    assert.equal([1, 2, 3].values().includes(2), true);
    assert.equal([1, 2, 3].values().includes(4), false);
    assert.equal([NaN].values().includes(NaN), true);
    assert.equal([0].values().includes(-0), true);
    assert.equal([1, 2, 3].values().includes(1, 1), false);
    assert.throws(() => [1, 2, 3].values().includes(2, -1), {
      name: 'RangeError',
    });
  });

  // https://github.com/tc39/proposal-iterator-join
  it(
    'does not support Iterator.join() yet',
    { skip: process.version >= 'v27' },
    () => {
      assert.throws(() => [1, 2, 3].values().join(), {
        name: 'TypeError',
      });
    },
  );

  it('supports Iterator.join()', { skip: process.version < 'v27' }, () => {
    assert.equal([1, 2, 3].values().join(), '1,2,3');
    assert.equal([1, 2, 3].values().join(' - '), '1 - 2 - 3');
    assert.equal([].values().join(), '');
    assert.equal([1, null, undefined, 4].values().join('|'), '1|||4');
  });

  // https://github.com/tc39/proposal-temporal
  it('supports Temporal', () => {
    assert.equal(
      Temporal.ZonedDateTime.from('2026-05-05T12:00:00[America/New_York]')
        .toInstant()
        .toString(),
      '2026-05-05T16:00:00Z',
    );
  });

  // https://github.com/tc39/proposal-joint-iteration
  it(
    'does not support Joint Iteration yet',
    { skip: process.version >= 'v27' },
    () => {
      assert.throws(
        () =>
          assert.deepEqual(
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
    },
  );

  it('supports Joint Iteration', { skip: process.version < 'v27' }, () => {
    assert.deepEqual(
      Iterator.zip([
        [0, 1, 2],
        [3, 4, 5],
      ]).toArray(),
      [
        [0, 3],
        [1, 4],
        [2, 5],
      ],
    );
    assert.deepEqual(
      Iterator.zipKeyed({
        a: [0, 1, 2],
        b: [3, 4, 5, 6],
        c: [7, 8, 9],
      })
        .map((value) => ({ ...value }))
        .toArray(),
      [
        { a: 0, b: 3, c: 7 },
        { a: 1, b: 4, c: 8 },
        { a: 2, b: 5, c: 9 },
      ],
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
