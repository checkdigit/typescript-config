// test/describe-it.ts

import type { describe as jestDescribe, it as jestIt } from '@jest/globals';
import { describe as nodeDescribe, it as nodeIt } from 'node:test';

/**
 * If we're running inside a Jest environment, "describe" and "it" will be defined globally.  If not, we fall back to
 * the built-in node.js test runner.
 */

export const describe: typeof jestDescribe =
  (globalThis as unknown as { describe: typeof jestDescribe }).describe ?? nodeDescribe;
export const it: typeof jestIt = (globalThis as unknown as { it: typeof jestIt }).it ?? nodeIt;
