// test/lib/es2026.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

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
  it(
    'does not support Math.sumPrecise yet',
    { skip: process.version >= 'v27' },
    async () => {
      assert.throws(
        () => assert.equal(Math.sumPrecise([1e20, 0.1, -1e20]), 0.1),
        {
          name: 'TypeError',
          message: 'Math.sumPrecise is not a function',
        },
      );
    },
  );

  it(
    'supports Math.sumPrecise',
    { skip: process.version < 'v27' },
    async () => {
      assert.equal(Math.sumPrecise([1e20, 0.1, -1e20]), 0.1);
    },
  );

  // https://github.com/tc39/proposal-arraybuffer-base64
  it('supports Uint8Array to/from base64 and hex', async () => {
    const array = new Uint8Array([
      72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100,
    ]);
    assert.deepEqual(array.toBase64(), 'SGVsbG8gV29ybGQ=');
    assert.deepEqual(array.toHex(), '48656c6c6f20576f726c64');
    assert.deepEqual(Uint8Array.fromBase64('SGVsbG8gV29ybGQ='), array);
    assert.deepEqual(Uint8Array.fromHex('48656c6c6f20576f726c64'), array);
  });

  // https://github.com/tc39/proposal-iterator-sequencing
  it('supports Iterator Sequencing', async () => {
    const lows = Iterator.from([0, 1, 2, 3]);
    const highs = Iterator.from([6, 7, 8, 9]);
    assert.deepEqual(
      [...Iterator.concat(lows, [4, 5], highs)],
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
  });

  // https://github.com/tc39/proposal-json-parse-with-source
  it('supports JSON.parse source text access', async () => {
    const tooBigForNumber = BigInt(Number.MAX_SAFE_INTEGER) + 2n;
    assert.equal(
      JSON.parse(String(tooBigForNumber), (_key, value, { source }) =>
        typeof source === 'string' && /^[0-9]+$/u.test(source)
          ? BigInt(source)
          : value,
      ) === tooBigForNumber,
      true,
    );
    const embedded = JSON.stringify({ tooBigForNumber }, (_key, val) =>
      typeof val === 'bigint' ? JSON.rawJSON(String(val)) : val,
    );
    assert.equal(embedded, '{"tooBigForNumber":9007199254740993}');
  });

  // https://github.com/tc39/proposal-upsert
  it('supports upsert', async () => {
    const map = new Map<string, number>();
    assert.equal(map.getOrInsert('x', 123), 123);
    assert.equal(map.getOrInsert('x', 456), 123);
    assert.equal(
      map.getOrInsertComputed('x', () => 456),
      123,
    );
    assert.equal(
      map.getOrInsertComputed('y', () => 789),
      789,
    );
  });
});
