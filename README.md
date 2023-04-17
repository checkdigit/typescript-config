# checkdigit/typescript-config

[![MIT License](https://img.shields.io/github/license/checkdigit/typescript-config)](https://github.com/checkdigit/typescript-config/blob/master/LICENSE.txt)

Copyright (c) 2022-2023 [Check Digit, LLC](https://checkdigit.com)

### Introduction

This module contains the standard Check Digit Typescript configuration.

- currently requires Node 16 or above.
- emits `esnext`, with the default libraries, to avoid down-leveling. It is intended that application spec tests pick
  up any issues with using newer features unavailable in a particular environment. Browsers and NodeJS are fast moving
  targets, and can add language features at any time.
- uses the `module` type of `commonjs`.
- all compiler options set for maximum strictness.

### Tests

This module includes a number of integration-style tests, to ensure that a specific version of Typescript will interoperate
with various bundlers, libraries and frameworks used by Check Digit:

- Jest and `ts-jest`
- ESLint and `@typescript-eslint/eslint-plugin`
- Built-in `node:test` runner
- prettier
- tsc
- swc
- esbuild

We do this to ensure that Typescript upgrades do not break these dependencies. New major versions of Typescript are not immediately
supported by projects such as ts-jest, eslint, prettier, etc. Our policy is to wait until these projects fully support
the new version of Typescript, and/or without emitting warnings during these tests, before publishing.

### A note about versioning

Strict semver is a little complicated, as Typescript itself does not adhere to semver. So our "best effort" policy is:

- Each update to the minimum Node target (e.g. Node 16 to Node 18) will result in a new major version of this module.
  We coordinate this with whatever the latest LTS version of Node is currently supported by Amazon Lambda, Google Cloud Functions
  and Azure Functions.
- Each new "major" version of Typescript (e.g. `4.2.x` to `4.3.x`) will result in a new minor version of this module.
- A new minor update of Typescript (e.g. `4.3.1` to `4.3.2`) _may_ result in a patch, in
  a situation where a specific need or issue requires setting a new minimum version of Typescript.

Bear in mind, any update of Typescript can potentially break your build. But hopefully in a way that's useful.

### Installation

```
npm add -D @checkdigit/typescript-config
```

Note: you do not need to explicitly install Typescript itself, as the most recent supported version comes in as a
peer dependency of `@checkdigit/typescript-config`.

Make sure your project's `tsconfig.json` extends `@checkdigit/typescript-config`.

### Example `tsconfig.json`

```
{
  "extends": "@checkdigit/typescript-config",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "build"
  },
  "exclude": [
    "node_modules",
    "build"
  ]
}
```

## License

MIT
