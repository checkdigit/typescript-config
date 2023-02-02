// index.spec.ts

import { strict as assert } from 'node:assert';

import index, { test } from './index';

describe('index', () => {
  it('should export default correctly', () => {
    assert.equal(index(), 'export default function');
  });

  it('should export test correctly', () => {
    assert.equal(test(), 'export function test');
  });
});
