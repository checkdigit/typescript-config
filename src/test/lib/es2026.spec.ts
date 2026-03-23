// test/lib/es2026.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

// file.only
describe('es2026', () => {
  // https://github.com/tc39/proposal-array-from-async
  it('supports Array.fromAsync', async () => {
    const result = await Array.fromAsync([1, 2, 3]);
    assert.deepEqual(result, [1, 2, 3]);
  });

  // https://github.com/tc39/proposal-is-error
  it('supports Error.isError', async () => {
    assert.ok(typeof Error.isError === 'function');
  });

  // https://github.com/tc39/proposal-math-sum
  it('does not support Math.sumPrecise yet', async () => {
    assert.throws(
      // @ts-expect-error not supported by TypeScript 6.0
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
      assert.equal(array.toBase64, undefined);
      assert.equal(array.toHex, undefined);
      assert.equal(Uint8Array.fromBase64, undefined);
      assert.equal(Uint8Array.fromHex, undefined);
    });
  } else {
    // Node 25+
    it('supports Uint8Array to/from base64 and hex', async () => {
      const array = new Uint8Array([
        72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100,
      ]);
      assert.deepEqual(array.toBase64(), 'SGVsbG8gV29ybGQ=');
      assert.deepEqual(array.toHex(), '48656c6c6f20576f726c64');
      assert.deepEqual(Uint8Array.fromBase64('SGVsbG8gV29ybGQ='), array);
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
          // @ts-expect-error not supported by TypeScript 6.0
          Iterator.concat(lows, [4, 5], highs),
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        ),
      {
        name: 'TypeError',
        message: 'Iterator.concat is not a function',
      },
    );
  });

  // https://github.com/tc39/proposal-json-parse-with-source
  it('supports JSON.parse source text access', async () => {
    const tooBigForNumber = BigInt(Number.MAX_SAFE_INTEGER) + 2n;
    assert.equal(
      // @ts-expect-error not supported by TypeScript 6.0
      JSON.parse(String(tooBigForNumber), (key, value, { source }) =>
        /^[0-9]+$/u.test(source) ? BigInt(source) : value,
      ) === tooBigForNumber,
      true,
    );
    // @ts-expect-error not supported by TypeScript 6.0
    const embedded = JSON.stringify({ tooBigForNumber }, (key, val) =>
      // @ts-expect-error not supported by TypeScript 6.0
      typeof val === 'bigint' ? JSON.rawJSON(String(val)) : val,
    );
    assert.equal(embedded, '{"tooBigForNumber":9007199254740993}');
  });

  // https://github.com/tc39/proposal-upsert
  it('supports upsert', async () => {
    const map = new Map<string, number>();
    // compiles, but unfortunately, Node.js does not support yet
    assert.throws(() => map.getOrInsert('x', 1), {
      name: 'TypeError',
    });
    assert.throws(() => map.getOrInsertComputed('x', () => 1), {
      name: 'TypeError',
    });
  });

  // https://github.com/tc39/proposal-temporal
  it('supports Temporal', () => {
    // compiles, but unfortunately, Node.js does not support yet
    assert.throws(() => Temporal.Now.instant(), {
      name: 'ReferenceError',
      message: 'Temporal is not defined',
    });
  });
});
