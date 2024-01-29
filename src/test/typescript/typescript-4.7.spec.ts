// test/typescript/typescript-4.7.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../../describe-it.test';

describe('typescript-4.7', () => {
  it('has typescript 4.7 features', () => {
    // control-flow analysis for bracketed element access
    const key = Symbol();
    const numberOrString = Math.random() < 0.5 ? 42 : 'hello';
    const obj = {
      [key]: numberOrString,
    };
    if (typeof obj[key] === 'string') {
      assert.ok(obj[key].toUpperCase()); // 4.7 knows that obj[key] is a string
    }
  });
});
