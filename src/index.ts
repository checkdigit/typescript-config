// index.ts

import { strict as assert } from 'node:assert';

/**
 * Check for Typescript 4.4 features
 */

interface SymbolIndexSignature {
  [name: symbol]: number;
}

assert.ok({} as SymbolIndexSignature);

interface Person {
  name: string;
  age?: number;
}

// @ts-expect-error
const person: Person = {
  name: 'Bob',
  age: undefined, // errors with exactOptionalPropertyTypes = true.
};

try {
  console.log('hello');
} catch (err) {
  // @ts-expect-error
  console.error(err.message); // errors with useUnknownInCatchVariables = true
}

/**
 * Check for Typescript 4.5 features
 */

// type modifiers on import names
import { ok, type AssertPredicate } from 'node:assert';

ok({} as AssertPredicate);

// Awaited type
ok({} as Awaited<Promise<string>>);

// template string types as discriminants
export interface Success {
  type: `${string}Success`;
  body: string;
}

export interface Error {
  type: `${string}Error`;
  message: string;
}

export function handler(r: Success | Error) {
  if (r.type === 'HttpSuccess') {
    // 'r' has type 'Success'
    assert.ok(r.body);
  }
}

/**
 * Check for Typescript 4.6 features
 */

// control flow analysis for destructured discriminated unions
type Action = { kind: 'NumberContents'; payload: number } | { kind: 'StringContents'; payload: string };

function processAction(action: Action) {
  const { kind, payload } = action;
  if (kind === 'NumberContents') {
    assert.ok(payload * 2);
  } else if (kind === 'StringContents') {
    assert.ok(payload.trim());
  }
}

assert.equal(processAction({ kind: 'NumberContents', payload: 5 }), undefined);

/**
 * Check for Typescript 4.7 features
 */

// control-flow analysis for bracketed element access
const key = Symbol();
const numberOrString = Math.random() < 0.5 ? 42 : 'hello';
const obj = {
  [key]: numberOrString,
};
if (typeof obj[key] === 'string') {
  assert.ok(obj[key].toUpperCase()); // 4.7 knows that obj[key] is a string
}
