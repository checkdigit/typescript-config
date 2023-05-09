// builder/builder.spec.mts

import { strict as assert } from 'node:assert';

// @ts-expect-error
import builder from './builder.mts';

describe('test builder', () => {
  it('should build', async () => {
    await assert.rejects(builder('../test/lib', 'hello'));
  });
});
