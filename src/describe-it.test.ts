// describe-it.ts

import { describe as nodeDescribe, it as nodeIt } from 'node:test';

/**
 * If we're running inside a Jest environment, "describe" and "it" will be defined globally.  If not, we fall back to
 * the built-in node.js test runner.
 */

export const describe = globalThis.describe ?? nodeDescribe;
export const it = globalThis.it ?? nodeIt;
