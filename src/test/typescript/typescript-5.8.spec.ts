// typescript/typescript-5.8.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('typescript-5.8', () => {
  it('checked returns for conditional and indexed access types', () => {
    const record: Record<string, string[]> = { a: ['a'], b: ['b'] };
    const array: string[] = ['a', 'b'];
    function getObject<T extends string | undefined>(
      group: T,
    ): T extends string ? string[] : T extends undefined ? Record<string, string[]> : never {
      if (group === undefined) {
        return record; // pre-5.8, errors with TS2322: Type 'Record<string, string[]>' is not assignable to type 'T extends string ? string[] : T extends undefined ? Record<string, string[]> : never'.
      }
      return array; // pre-5.8, errors with TS2322: Type 'string[]' is not assignable to type 'T extends string ? string[] : T extends undefined ? Record<string, string[]> : never'.
    }
    assert.equal(getObject(undefined), record);
    assert.equal(getObject('hello'), array);
  });
});
