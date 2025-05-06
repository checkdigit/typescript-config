// test/lib/es2025.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('es2025', () => {
  // https://github.com/tc39/proposal-duplicate-named-capturing-groups
  if (process.version < 'v23') {
    it('does not support duplicate named capturing groups', async () => {
      assert.throws(
        () =>
          // eslint-disable-next-line no-eval
          eval(
            "/(?<year>[0-9]{4})-[0-9]{2}|[0-9]{2}-(?<year>[0-9]{4})/u.exec('12-1984')?.groups?.['year']",
          ),
        {
          name: 'SyntaxError',
          message:
            'Invalid regular expression: /(?<year>[0-9]{4})-[0-9]{2}|[0-9]{2}-(?<year>[0-9]{4})/u: Duplicate capture group name',
        },
      );
    });
  } else {
    it('supports duplicate named capturing groups', async () => {
      assert.equal(
        // eslint-disable-next-line no-eval
        eval(
          "/(?<year>[0-9]{4})-[0-9]{2}|[0-9]{2}-(?<year>[0-9]{4})/u.exec('12-1984')?.groups?.['year']",
        ),
        '1984',
      );
      // commented out due to parsing error in Node 22 (works in Node 23)
      // assert.equal(/(?<year>[0-9]{4})-[0-9]{2}|[0-9]{2}-(?<year>[0-9]{4})/u.exec('12-1984')?.groups?.['year'], '1984');
      // assert.equal(/(?<year>[0-9]{4})-[0-9]{2}|[0-9]{2}-(?<year>[0-9]{4})/u.exec('1984-12')?.groups?.['year'], '1984');
    });
  }

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
  it('support sync iterator helpers', async () => {
    function* naturals() {
      let i = 0;
      while (true) {
        yield i;
        i += 1;
      }
    }

    // map(), filter(), drop(), take()
    const iterator1 = naturals()
      .map((value) => value * value)
      .filter((value) => value % 2 === 0)
      .drop(1)
      .take(3);
    assert.equal(iterator1.next().value, 4);
    assert.equal(iterator1.next().value, 16);
    assert.equal(iterator1.next().value, 36);
    assert.equal(iterator1.next().done, true);

    // reduce()
    assert.equal(
      naturals()
        .take(5)
        .reduce((sum, value) => sum + value, 3),
      13,
    );

    // flatMap(), toArray()
    const iterator2 = ["It's Sunny in", '', 'California']
      .values()
      .flatMap((value) => value.split(' ').values());
    assert.deepEqual(iterator2.toArray(), [
      "It's",
      'Sunny',
      'in',
      '',
      'California',
    ]);

    // forEach()
    let counter = 0;
    naturals()
      .take(5)
      .forEach((value) => {
        counter += value;
      });
    assert.equal(counter, 10);

    // some()
    assert.equal(
      naturals().some((value) => value === 3),
      true,
    );
    assert.equal(
      naturals()
        .take(2)
        .some((value) => value === 3),
      false,
    );

    // every()
    assert.equal(
      naturals()
        .take(3)
        .every((value) => value < 3),
      true,
    );
    assert.equal(
      naturals().every((value) => value < 3),
      false,
    );

    // find()
    assert.equal(
      naturals()
        .take(4)
        .find((value) => value === 3),
      3,
    );
    assert.equal(
      naturals()
        .take(3)
        .find((value) => value === 3),
      undefined,
    );

    // Iterator.from()
    const iterator3 = Iterator.from({
      next: () => ({ value: 1, done: false }),
    });
    assert(iterator3 instanceof Iterator);
    assert.equal(iterator3.next().value, 1);
  });

  // https://github.com/tc39/proposal-promise-try
  it('support Promise.try()', async () => {
    try {
      const result1 = await Promise.try(() => 1 + 2);
      const result2 = await Promise.try(async () => 1 + 2);
      assert.equal(result1, 3);
      assert.equal(result2, 3);
    } catch (error) {
      if (process.version < 'v23' && error instanceof TypeError) {
        // Node 22 does not support Promise.try(), so we expect a TypeError
      } else {
        throw error;
      }
    }
  });

  // https://github.com/tc39/proposal-float16array
  it('does not support Float16Array', async () => {
    // neither Node 22 nor 23 currently support Float16Array or Math.f16round()
    assert.throws(() => new Float16Array(8), {
      name: 'ReferenceError',
      message: 'Float16Array is not defined',
    });
    assert.equal(Math.f16round, undefined);
    // const array = new Float16Array(8);
    // assert.equal(array.length, 8);
    // assert.equal(Math.f16round(1.2), 1.2001953125);
  });

  // https://github.com/tc39/proposal-regex-escaping
  it('does not support RegExp escaping', async () => {
    // neither Node 22 nor 23 currently support RegExp.escape
    // eslint-disable-next-line no-eval
    assert.throws(() => eval('RegExp.escape("")'), {
      name: 'TypeError',
      message: 'RegExp.escape is not a function',
    });
    // assert.equal(RegExp.escape('The Quick Brown Fox'), '\\x54he\\x20Quick\\x20Brown\\x20Fox');
  });
});
