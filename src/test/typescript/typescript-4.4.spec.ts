// test/typescript/typescript-4.4.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

describe('typescript-4.4', () => {
  it('has typescript 4.4 features', () => {
    interface SymbolIndexSignature44 {
      [name: symbol]: number;
    }

    assert.ok({} as SymbolIndexSignature44);

    interface Person44 {
      name: string;
      age?: number;
    }

    // @ts-expect-error
    const person: Person44 = {
      name: 'Bob',
      age: undefined, // errors with exactOptionalPropertyTypes = true.
    };

    try {
      // do nothing
    } catch (error) {
      // @ts-expect-error
      // eslint-disable-next-line no-console
      console.error(err.message); // errors with useUnknownInCatchVariables = true
    }
  });
});
