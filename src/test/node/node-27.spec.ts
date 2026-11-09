// test/node/node-27.spec.ts

import { strict as assert } from 'node:assert';
import http from 'node:http';
import module from 'node:module';
import net from 'node:net';
import { describe, it } from 'node:test';

describe('node-27', { skip: process.version < 'v27' }, () => {
  // 27+
  it('node:net/promises is available as a built-in module', async () => {
    assert.ok(module.isBuiltin('node:net/promises'));
  });

  // 27+
  it('SourceMap payload is frozen', async () => {
    const sourceMap = new module.SourceMap({
      version: 3,
      file: 'example.js',
      sources: [],
      sourcesContent: [],
      names: [],
      mappings: '',
      sourceRoot: '',
    });
    assert.ok(Object.isFrozen(sourceMap.payload));
  });

  // 27+
  it('HTTP keepAliveTimeout defaults to 65 seconds', async () => {
    const server = http.createServer();
    assert.equal(server.keepAliveTimeout, 65_000);
  });

  // 27+
  it('HTTP request headers have a null prototype', async () => {
    const socket = new net.Socket();
    try {
      const request = new http.IncomingMessage(socket);
      assert.equal(Object.getPrototypeOf(request.headers), null);
    } finally {
      socket.destroy();
    }
  });
});
