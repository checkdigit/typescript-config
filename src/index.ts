// index.ts

/**
 * Check for Typescript 4.4 features
 */

interface SymbolIndexSignature {
  [name: symbol]: number;
}

interface Person {
  name: string,
  age?: number;
}

const person: Person = {
  name: "Bob",
  // @ts-expect-error
  age: undefined, // errors with exactOptionalPropertyTypes = true.
};

try {
  console.log('hello');
}
catch (err) {
  // @ts-expect-error
  console.error(err.message); // errors with useUnknownInCatchVariables = true
}
