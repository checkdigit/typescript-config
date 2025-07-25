// test/typescript/typescript-5.9-defer.test.ts

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
globalThis.sideEffect = 123;

export const thing = 3;
