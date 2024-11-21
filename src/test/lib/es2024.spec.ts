// test/lib/es2024.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

describe('supports es2024', () => {
  // https://github.com/tc39/proposal-array-grouping
  it('supports array grouping', async () => {
    const objectGroupBy = Object.groupBy([0, 1, 2, 3, 4, 5], (num) => (num % 2 === 0 ? 'even' : 'odd'));
    assert.deepEqual(
      { ...objectGroupBy },
      {
        even: [0, 2, 4],
        odd: [1, 3, 5],
      },
    );

    const mapGroupBy = Map.groupBy([0, 1, 2, 3, 4, 5], (num) => (num % 2 === 0 ? 'even' : 'odd'));
    assert.deepEqual(Object.fromEntries(mapGroupBy), {
      even: [0, 2, 4],
      odd: [1, 3, 5],
    });
  });

  // https://github.com/tc39/proposal-atomics-wait-async
  it('supports Atomics.waitAsync', async () => {
    assert.equal(typeof Atomics.waitAsync, 'function');
  });

  // https://github.com/tc39/proposal-resizablearraybuffer
  it('supports resizable ArrayBuffer', async () => {
    const resizableArrayBuffer = new ArrayBuffer(1024, { maxByteLength: 1024 ** 2 });
    assert.equal(typeof resizableArrayBuffer.resize, 'function');
  });

  // https://github.com/tc39/proposal-arraybuffer-transfer
  it('supports ArrayBuffer.transfer', async () => {
    const resizableArrayBuffer = new ArrayBuffer(1024);
    assert.equal(typeof resizableArrayBuffer.transfer, 'function');
  });

  // https://github.com/tc39/proposal-promise-with-resolvers
  it('supports Promise.withResolvers', async () => {
    assert.equal(typeof Promise.withResolvers, 'function');
  });

  // https://github.com/tc39/proposal-regexp-v-flag
  it('support RegExp v flag', async () => {
    assert.equal(/[\p{Decimal_Number}--[0-9]]/v.test('𑜹'), true);
    assert.equal(/[\p{Decimal_Number}--[0-9]]/v.test('4'), false);
  });

  it('supports well-formed Unicode strings', async () => {
    assert.equal(typeof ''.isWellFormed, 'function');
    assert.equal(typeof ''.toWellFormed, 'function');
  });
});
