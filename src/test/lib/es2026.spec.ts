// test/lib/es2026.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('es2026', () => {
  // https://github.com/tc39/proposal-is-error
  it('supports Error.isError', async () => {
    assert.ok(typeof Error.isError === 'function');
  });

  // https://github.com/tc39/proposal-math-sum
  it('does not support Math.sumPrecise yet', async () => {
    assert.throws(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      () => assert.equal(Math.sumPrecise([1e20, 0.1, -1e20]), 0.1),
      {
        name: 'TypeError',
        message: 'Math.sumPrecise is not a function',
      },
    );
  });

  // https://github.com/tc39/proposal-arraybuffer-base64
  if (process.version < 'v25') {
    // Node 24
    it('does not support Uint8Array to/from base64 and hex yet', async () => {
      const array = new Uint8Array([
        72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100,
      ]);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      assert.equal(array.toBase64, undefined);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      assert.equal(array.toHex, undefined);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      assert.equal(array.fromBase64, undefined);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      assert.equal(array.fromHex, undefined);
    });
  } else {
    // Node 25+
    it('supports Uint8Array to/from base64 and hex', async () => {
      const array = new Uint8Array([
        72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100,
      ]);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      assert.deepEqual(array.toBase64(), 'SGVsbG8gV29ybGQ=');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      assert.deepEqual(array.toHex(), '48656c6c6f20576f726c64');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      assert.deepEqual(Uint8Array.fromBase64('SGVsbG8gV29ybGQ='), array);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      assert.deepEqual(Uint8Array.fromHex('48656c6c6f20576f726c64'), array);
    });
  }

  // https://github.com/tc39/proposal-iterator-sequencing
  it('does not support Iterator Sequencing yet', async () => {
    const lows = Iterator.from([0, 1, 2, 3]);
    const highs = Iterator.from([6, 7, 8, 9]);
    assert.throws(
      () =>
        assert.deepEqual(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          Iterator.concat(lows, [4, 5], highs),
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        ),
      {
        name: 'TypeError',
        message: 'Iterator.concat is not a function',
      },
    );
  });
});
