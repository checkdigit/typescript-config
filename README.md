# checkdigit/typescript-config

[![MIT License](https://img.shields.io/github/license/checkdigit/typescript-config)](https://github.com/checkdigit/typescript-config/blob/main/LICENSE.txt)

Copyright © 2021–2026 [Check Digit, LLC](https://checkdigit.com)

## Introduction

This module contains the standard Check Digit TypeScript configuration, along with our standard build tool `builder`.

## TypeScript Configuration

- Requires Node.js 26.13 or later and `@types/node` 26 or later.
- Targets `esnext`, with the default libraries. Application tests should check that the features used are available
  in the deployment runtime.
- Uses `moduleResolution: "bundler"` and `verbatimModuleSyntax`.
- Enables `strict` mode and additional checks, including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  and unused local and parameter checks.
- Enables `isolatedDeclarations`, `allowImportingTsExtensions`, and `erasableSyntaxOnly`.
- Sets `noEmit: true`; use `builder` to generate JavaScript and declarations.

## Builder

`builder` is a command line tool that generates ESM `.mjs` modules or TypeScript `.d.ts` declarations.
It is intended to be used when publishing a package to npm, or to bundle a package for deployment to Node.js.
It type-checks the source with the native TypeScript compiler before generating output, using the compiler's async API
for declarations and `esbuild` for JavaScript.

The compiler peer dependency is TypeScript `7.1.0`, installed under the `@typescript/native` npm alias.
This repository's lint tooling separately uses the TypeScript 6 compatibility package (`@typescript/typescript6`,
installed as `typescript`) for `typescript-eslint`.

The builder uses this package's compiler configuration directly; it does not read the consuming project's `tsconfig.json`.
Without an entry point, it processes all `.ts` files under the input directory recursively, including test files,
and rewrites relative TypeScript imports for the generated `.mjs` files.

Single-file bundles include Node.js compatibility bindings for `require`, `__filename`, and `__dirname` to support
bundled CommonJS dependencies. These bindings are local to the bundle, and the output is intended for Node.js.
Bundle builds also write `metafile.json` in the output directory and print a size summary.

### Options

| Option         | Short form | Description                                                                                                                         |
| -------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--type`       | `-t`       | Output type: `module` (ESM, the default) or `types` (declarations).                                                                 |
| `--inDir`      | `-i`       | Input source directory, relative to the current directory. Defaults to `src`.                                                       |
| `--outDir`     | `-o`       | Output directory, relative to the current directory. Defaults to `build`.                                                           |
| `--entryPoint` | `-e`       | Entry point relative to `--inDir`. For module output, enables a single-file bundle. Requires `--outFile`.                           |
| `--outFile`    | `-f`       | Bundle filename relative to `--outDir`. Requires `--entryPoint`. Does not combine declaration files.                                |
| `--external`   | `-x`       | Modules to exclude from a bundle. Repeat for multiple patterns; quote wildcard `*` patterns. Node.js built-ins are always external. |
| `--minify`     | `-m`       | Minify JavaScript output. Defaults to `false`.                                                                                      |
| `--sourceMap`  | `-s`       | Include inline JavaScript source maps. Defaults to `false`.                                                                         |

### Examples

```shell
# build ESM .mjs files from TypeScript source
npx builder --type=module --outDir=build-esm

# build single-file ESM .mjs bundle from TypeScript source
npx builder --type=module --outDir=build-esm-bundle --entryPoint=index.ts --outFile=index.mjs

# generate declarations alongside the JavaScript build
npx builder --type=types --outDir=build-types

# bundle with source maps while leaving selected dependencies external
npx builder --entryPoint=index.ts --outFile=index.mjs --sourceMap --external='@example/*' --external=another-package
```

## Tests

This module includes compiler, builder, and runtime tests to check interoperability with the tools and
language features used by Check Digit:

- Recent TC39 proposals
- Node.js APIs, with version-specific tests
- ESLint and `typescript-eslint`
- Built-in `node:test` runner
- `prettier`
- The native TypeScript compiler, and features introduced in TypeScript 5.x, 6.0, and 7.1
- `esbuild`
- Wallaby.js (supports `node:test` by relying on native Node type-stripping support)

We do this to ensure that TypeScript upgrades do not break these dependencies,
and that updates to these related projects do not break builds.

Note: New major versions of TypeScript are not immediately
supported by projects such as eslint, prettier, typescript-eslint,
etc. Our policy is to wait until these projects fully support
the new version of TypeScript, and/or without emitting warnings during these tests, before publishing.

### A note about versioning

Strict semver is a little complicated, as TypeScript itself does not adhere to semver. So our "best effort" policy is:

- Each update to the minimum supported Node.js version, or a change to a major compiler output option
  (e.g. `module`, `target` or `moduleResolution`) will result in a new major version of this module.
- Each new TypeScript feature release (e.g. `7.0.x` to `7.1.x`) will result in a new minor version of this module.
- A TypeScript patch release or a key dependency update _may_ result in a patch version of this module.

Bear in mind, any update of TypeScript can potentially break your build. But hopefully in a way that's useful.

### Installation

```shell
npm add -D @checkdigit/typescript-config
```

The required compiler (`@typescript/native`), `@types/node`, and `esbuild` are peer dependencies, which npm installs
automatically by default. A separate `typescript` installation is not required to use the builder.

Make sure your project's `tsconfig.json` extends `@checkdigit/typescript-config`.

### Example `tsconfig.json`

```json
{
  "extends": "@checkdigit/typescript-config"
}
```

This configuration checks types without emitting files and uses `moduleResolution: "bundler"`.
Use `builder` to produce deployable Node.js code, or another build tool that handles these module resolution rules.

## License

MIT
