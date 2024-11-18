// test/typescript/typescript-5.0.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

describe('typescript-5.0', () => {
  it('supports const type parameters', async () => {
    interface HasNames {
      names: readonly string[];
    }

    function getNamesExactly<const T extends HasNames>(arg: T): T['names'] {
      return arg.names;
    }

    const names = getNamesExactly({ names: ['Alice', 'Bob', 'Eve'] });
    assert.deepEqual(names, ['Alice', 'Bob', 'Eve']);
  });
});
