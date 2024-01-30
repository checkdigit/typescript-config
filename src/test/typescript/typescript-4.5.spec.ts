// test/typescript/typescript-4.5.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

// 4.5 introduces type modifiers on import names
import { ok, type AssertPredicate } from 'node:assert';

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

    function handler45(r: Success45 | Error45) {
      if (r.type === 'HttpSuccess') {
        // 'r' has type 'Success'
        assert.ok(r.body);
      }
    }
    handler45({ type: 'HttpSuccess', body: 'Hello' });
  });
});
