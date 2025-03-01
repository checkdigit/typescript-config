// test/lib/es2025.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('supports es2025', () => {
  // https://github.com/tc39/proposal-duplicate-named-capturing-groups
  it('supports duplicate named capturing groups', async () => {
    // commented out due to parsing error in Node 22 (works in Node 23)
    // assert.equal(/(?<year>[0-9]{4})-[0-9]{2}|[0-9]{2}-(?<year>[0-9]{4})/u.exec('12-1984')?.groups?.['year'], '1984');
    // assert.equal(/(?<year>[0-9]{4})-[0-9]{2}|[0-9]{2}-(?<year>[0-9]{4})/u.exec('1984-12')?.groups?.['year'], '1984');
  });

  // https://github.com/tc39/proposal-set-methods
  it('supports new Set methods', async () => {
    const set1 = new Set([1, 2, 3]);
    const set2 = new Set([2, 3, 4]);
    const set3 = new Set([5, 6]);
    const set4 = new Set([2, 3]);
    assert.deepEqual([...set1.intersection(set2)], [2, 3]);
    assert.deepEqual([...set1.union(set2)], [1, 2, 3, 4]);
    assert.deepEqual([...set1.difference(set2)], [1]);
    assert.deepEqual([...set1.difference(set3)], [1, 2, 3]);
    assert.deepEqual([...set1.symmetricDifference(set2)], [1, 4]);
    assert.deepEqual(set1.isSubsetOf(set2), false);
    assert.deepEqual(set4.isSubsetOf(set1), true);
    assert.deepEqual(set1.isSupersetOf(set2), false);
    assert.deepEqual(set1.isSupersetOf(set4), true);
    assert.deepEqual(set1.isDisjointFrom(set2), false);
    assert.deepEqual(set1.isDisjointFrom(set3), true);
  });

  // https://github.com/tc39/proposal-regexp-modifiers
  it('supports regular expression pattern modifiers', async () => {
    // commented out due to parsing error in Node 22 (works in Node 23)
    // const re1 = /^[a-z](?-i:[a-z])$/i;
    // re1.test('ab'); // true
    // re1.test('Ab'); // true
    // re1.test('aB'); // false
    // const re2 = /^(?i:[a-z])[a-z]$/;
    // re2.test('ab'); // true
    // re2.test('Ab'); // true
    // re2.test('aB'); // false
  });

  // https://github.com/tc39/proposal-iterator-helpers
  // https://github.com/tc39/proposal-promise-try
  // https://github.com/tc39/proposal-float16array
  // https://github.com/tc39/proposal-regex-escaping
});
