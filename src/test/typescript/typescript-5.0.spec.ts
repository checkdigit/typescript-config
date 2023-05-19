// typescript-5.0.spec.ts

import { strict as assert } from 'node:assert';

import got from 'got'; // CJS version of got

import moduleDefault, { test } from './module.test';
import moduleDirectory from './module-directory';

import { describe, it } from '../../describe-it.test';

describe('typescript-5.0', () => {
  it('"this" is an object', () => {
    assert.ok(typeof this === 'object');
  });

  it('should export default correctly', () => {
    assert.equal(moduleDefault(), 'export default function');
  });

  it('should export test function correctly', () => {
    assert.equal(test(), 'export function test');
  });

  it('should work with module directories', () => {
    assert.equal(moduleDirectory(), 'module-directory-index');
  });

  it('should work with CJS modules', async () => {
    assert.equal(typeof got, 'function');
    assert.equal(typeof got.put, 'function');
  });

  it('supports const type parameters', async () => {
    type HasNames = { names: readonly string[] };

    function getNamesExactly<const T extends HasNames>(arg: T): T['names'] {
      return arg.names;
    }

    const names = getNamesExactly({ names: ['Alice', 'Bob', 'Eve'] });
    assert.deepEqual(names, ['Alice', 'Bob', 'Eve']);
  });
});
