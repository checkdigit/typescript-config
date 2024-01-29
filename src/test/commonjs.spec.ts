// test/commonjs.spec.ts

import { strict as assert } from 'node:assert';

import jsonSchemaRefParser from '@apidevtools/json-schema-ref-parser';

import { describe, it } from '../describe-it.test';

describe('commonjs', () => {
  it('should work with CJS module that uses __dirname', async () => {
    assert.equal(typeof jsonSchemaRefParser.parse, 'function');
  });
});
