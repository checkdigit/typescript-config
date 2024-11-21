// test/typescript/typescript-4.5.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it.ts';

// 4.5 introduces type modifiers on import names
// eslint-disable-next-line no-duplicate-imports
import { type AssertPredicate, ok } from 'node:assert';

describe('typescript-4.5', () => {
  it('has typescript 4.5 features', () => {
    ok({} as AssertPredicate);

    // Awaited type
    ok({} as Awaited<Promise<string>>);

    // template string types as discriminants
    interface Success45 {
      type: `${string}Success`;
      body: string;
    }

    interface Error45 {
      type: `${string}Error`;
      message: string;
    }

    function handler45(thing: Success45 | Error45) {
      if (thing.type === 'HttpSuccess') {
        // 'r' has type 'Success'
        assert.ok(thing.body);
      }
    }
    handler45({ type: 'HttpSuccess', body: 'Hello' });
  });
});
