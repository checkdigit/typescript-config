// test/typescript/typescript-5.0.spec.ts

import { strict as assert } from 'node:assert';
import module from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

describe('node-22', () => {
  // 22.13+
  it('has assert.partialDeepStrictEqual()', () => {
    assert.partialDeepStrictEqual({ a: 1, b: 1 }, { a: 1 });
  });

  // 22.14+
  it('has module.findPackageJSON()', async () => {
    const packageJSONFileName = module.findPackageJSON(
      'typescript',
      fileURLToPath(import.meta.url),
    );
    assert.ok(packageJSONFileName !== undefined);
    const packageJSON = await import(packageJSONFileName, {
      with: { type: 'json' },
    });
    assert.partialDeepStrictEqual(packageJSON.default, {
      name: 'typescript',
    });

    const packageJSONFileNameLocal = module.findPackageJSON(
      '.',
      fileURLToPath(import.meta.url),
    );
    assert.ok(packageJSONFileNameLocal !== undefined);
    const packageJSONLocal = await import(packageJSONFileNameLocal, {
      with: { type: 'json' },
    });
    assert.partialDeepStrictEqual(packageJSONLocal.default, {
      name: '@checkdigit/typescript-config',
    });
  });
});
