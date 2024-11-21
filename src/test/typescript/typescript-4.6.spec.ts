// test/typescript/typescript-4.6.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it.ts';

describe('typescript-4.6', () => {
  it('has typescript 4.6 features', () => {
    // control flow analysis for destructured discriminated unions
    type Action46 = { kind: 'NumberContents'; payload: number } | { kind: 'StringContents'; payload: string };

    function processAction46(action: Action46) {
      const { kind, payload } = action;
      if (kind === 'NumberContents') {
        assert.ok(payload * 2);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (kind === 'StringContents') {
        assert.ok(payload.trim());
      }
    }
    assert.equal(processAction46({ kind: 'NumberContents', payload: 5 }), undefined);
  });
});
