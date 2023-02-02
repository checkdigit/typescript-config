// typescript-5.0.ts

import getPort from 'get-port'; // ESM version of get-port

/**
 * Check for Typescript 5.0/ESM features
 */

export async function port() {
  return getPort();
}
