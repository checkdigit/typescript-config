// test/describe-it.ts

import type { describe as jestDescribe, it as jestIt } from '@jest/globals';
import { describe as nodeDescribe, it as nodeIt } from 'node:test';

/**
 * If we're running inside a Jest environment, "describe" and "it" will be defined globally.  If not, we fall back to
 * the built-in node.js test runner.
 */

export const describe: typeof jestDescribe =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  (globalThis as unknown as { describe: typeof jestDescribe }).describe ?? nodeDescribe;
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const it: typeof jestIt = (globalThis as unknown as { it: typeof jestIt }).it ?? nodeIt;
