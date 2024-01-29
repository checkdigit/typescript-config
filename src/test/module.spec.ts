// module.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it.test';
import moduleDefault, { test } from './module.test';
import moduleDirectory from './module-directory';

describe('module', () => {
  it('should export default correctly', () => {
    assert.equal(moduleDefault(), 'export default function');
  });

  it('should export test function correctly', () => {
    assert.equal(test(), 'export function test');
  });

  it('should work with module directories', () => {
    assert.equal(moduleDirectory(), 'module-directory-index');
  });
});
