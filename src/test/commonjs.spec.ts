// commonjs.spec.ts

import { strict as assert } from 'node:assert';

import got from 'got';
import jsonSchemaRefParser from '@apidevtools/json-schema-ref-parser';

import { describe, it } from '../describe-it.test';

describe('commonjs', () => {
  it('should work with CJS version of got', async () => {
    assert.equal(typeof got, 'function');
    assert.equal(typeof got.put, 'function');
  });

  it('should work with CJS module that uses __dirname', async () => {
    assert.equal(typeof jsonSchemaRefParser.parse, 'function');
  });
});
