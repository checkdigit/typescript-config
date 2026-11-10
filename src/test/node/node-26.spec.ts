// test/node/node-26.spec.ts

import { strict as assert } from 'node:assert';
import { AsyncLocalStorage } from 'node:async_hooks';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';

describe('node-26', () => {
  // 26+
  it('ErrorEvent exists as a global', () => {
    const error = new Error('oops');
    const event = new ErrorEvent('error', { message: error.message, error });
    assert.equal(event.message, 'oops');
    assert.equal(event.error, error);
  });

  // 26+
  it('AsyncLocalStorage.withScope() restores the previous store', () => {
    const storage = new AsyncLocalStorage<string>();
    storage.run('outer', () => {
      {
        using _scope = storage.withScope('inner');
        assert.equal(storage.getStore(), 'inner');
      }
      assert.equal(storage.getStore(), 'outer');
    });
    assert.equal(storage.getStore(), undefined);
  });

  // 26.1+
  it(
    'SQLite databases can be serialized',
    { skip: process.version < 'v26.1' },
    () => {
      using database = new DatabaseSync(':memory:');
      database.exec('CREATE TABLE example (value TEXT)');
      const serialized = database.serialize();
      assert.equal(
        Buffer.from(serialized.subarray(0, 16)).toString(),
        'SQLite format 3\0',
      );
    },
  );
});
