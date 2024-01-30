// test/lib/es2024.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

(process.version < 'v21' ? describe.skip : describe)('supports es2024', () => {
  it('supports Object.groupBy', async () => {
    const groupBy = Object.groupBy([0, 1, 2, 3, 4, 5], (num) => (num % 2 === 0 ? 'even' : 'odd'));
    assert.deepEqual(
      { ...groupBy },
      {
        even: [0, 2, 4],
        odd: [1, 3, 5],
      },
    );
  });

  it('supports Map.groupBy', async () => {
    const groupBy = Map.groupBy([0, 1, 2, 3, 4, 5], (num) => (num % 2 === 0 ? 'even' : 'odd'));
    assert.deepEqual(Object.fromEntries(groupBy), {
      even: [0, 2, 4],
      odd: [1, 3, 5],
    });
  });
});
