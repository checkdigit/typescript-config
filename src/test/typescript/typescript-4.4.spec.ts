// test/typescript/typescript-4.4.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it.ts';

describe('typescript-4.4', () => {
  it('has typescript 4.4 features', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
    interface SymbolIndexSignature44 {
      [name: symbol]: number;
    }

    assert.ok({} as SymbolIndexSignature44);

    interface Person44 {
      name: string;
      age?: number;
    }

    // @ts-expect-error errors in Typescript 4.4
    const _person: Person44 = {
      name: 'Bob',
      age: undefined, // errors with exactOptionalPropertyTypes = true.
    };

    try {
      // do nothing
    } catch (err) {
      // @ts-expect-error errors in Typescript 4.4
      // eslint-disable-next-line no-console
      console.error(err.message); // errors with useUnknownInCatchVariables = true
    }
  });
});
