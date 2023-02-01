import { strict as assert } from 'node:assert';

/**
 * Check for Typescript 4.9 features
 */
type Colors49 = 'red' | 'green' | 'blue';
type RGB49 = [red: number, green: number, blue: number];
const palette49 = {
  red: [255, 0, 0],
  green: '#00ff00',
  // @ts-expect-error
  bleu: [0, 0, 255], //  typo is now caught
} satisfies Record<Colors49, string | RGB49>;
assert.equal(typeof palette49, 'object');
