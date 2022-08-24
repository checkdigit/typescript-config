// index.ts

import { strict as assert } from 'node:assert';

/**
 * Check for Typescript 4.4 features
 */

interface SymbolIndexSignature44 {
  [name: symbol]: number;
}

assert.ok({} as SymbolIndexSignature44);

interface Person44 {
  name: string;
  age?: number;
}

// @ts-expect-error
const person: Person44 = {
  name: 'Bob',
  age: undefined, // errors with exactOptionalPropertyTypes = true.
};

try {
  console.log('hello');
} catch (error) {
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
interface Success45 {
  type: `${string}Success`;
  body: string;
}

interface Error45 {
  type: `${string}Error`;
  message: string;
}

function handler45(r: Success45 | Error45) {
  if (r.type === 'HttpSuccess') {
    // 'r' has type 'Success'
    assert.ok(r.body);
  }
}
handler45({ type: 'HttpSuccess', body: 'Hello' });

/**
 * Check for Typescript 4.6 features
 */

// control flow analysis for destructured discriminated unions
type Action46 = { kind: 'NumberContents'; payload: number } | { kind: 'StringContents'; payload: string };

function processAction46(action: Action46) {
  const { kind, payload } = action;
  if (kind === 'NumberContents') {
    assert.ok(payload * 2);
  } else if (kind === 'StringContents') {
    assert.ok(payload.trim());
  }
}
assert.equal(processAction46({ kind: 'NumberContents', payload: 5 }), undefined);

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

/**
 * Check for Typescript 4.8 features
 */

// improved intersection reduction, union compatibility, and narrowing
function f48(x: unknown, y: {} | null | undefined) {
  x = y;
  y = x; // works in 4.8
  assert.equal(x, y);
}
f48(null, undefined);

function foo48<T>(x: NonNullable<T>, y: NonNullable<NonNullable<T>>) {
  x = y;
  y = x; // works in 4.8
  assert.equal(x, y);
}
foo48<string>('hello', 'world');

function throwIfNullable48<T>(value: T): NonNullable<T> {
  if (value === undefined || value === null) {
    throw Error('Nullable value!');
  }
  return value; // works in 4.8
}
assert.equal(throwIfNullable48(42), 42);

console.log('complete');
