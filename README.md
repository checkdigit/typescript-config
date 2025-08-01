# checkdigit/typescript-config

[![MIT License](https://img.shields.io/github/license/checkdigit/typescript-config)](https://github.com/checkdigit/typescript-config/blob/master/LICENSE.txt)

Copyright © 2021–2025 [Check Digit, LLC](https://checkdigit.com)

## Introduction

This module contains the standard Check Digit TypeScript configuration, along with our standard build tool `builder`.

## TypeScript Configuration

- currently requires Node 22.15 or above.
- emits `esnext`, with the default libraries, to avoid down-leveling. It is intended that application spec tests pick
  up any issues with using newer features unavailable in a particular environment. Browsers and Node.js are fast-moving
  targets, and can add language features at any time.
- uses the `module` type of `esnext`.
- all compiler options set for maximum strictness.

## Builder

`builder` is a command line tool that generates ESM modules from the TypeScript source.
It is intended to be used when publishing a package to NPM, or to bundle a package for deployment.
It uses `tsc` for generating types, and `esbuild` for generating code.

**Note:** the `require` function will be defined as a global variable, to allow
dynamic `require`s by CommonJS submodules. This is not a problem for Node.js, but will cause issues in a browser environment.

### Options

- `--type` the type of output to generate. Defaults to `module` (ESM). Valid values are `module` or `types`.
- `--entryPoint` the entry point for the bundle, relative to the inDir. if not provided, the files in the inDir will
  be processed as individual unbundled files.
- `--inDir` the input source code directory.
- `--outDir` the output directory.
- `--outFile` the output file, relative to `--outDir`. This is provided for single-file bundles, along with `--entryPoint`.
- `--external` external modules to exclude from the bundle. Built-in `node` modules are automatically excluded.
  A wildcard `*` can be used to exclude multiple external modules.
- `--minify` whether to minify the output.
- `--sourceMap` whether to include inline sourcemap.

### Examples

```shell
# build ESM .mjs files from TypeScript source
npx builder --type=module --outDir=build-esm

# build single-file ESM .mjs bundle from TypeScript source
npx builder --type=module --outDir=build-esm-bundle --entryPoint=index.ts --outFile=index.mjs
```

## Tests

This module includes a number of integration-style tests,
to ensure that a specific version of TypeScript will interoperate
with `builder`, in addition to runtimes, libraries and frameworks used by Check Digit:

- Recent TC39 proposals
- Node versions supported by AWS Lambda, Google Cloud Functions, and Azure Functions
- ESLint and `@typescript-eslint/eslint-plugin`
- Built-in `node:test` runner
- `prettier`
- `tsc`, and specific features introduced in each version of TypeScript
- `esbuild`
- Wallaby.js (supports `node:test` by including `@swc-node/register` as a peer dependency)

We do this to ensure that TypeScript upgrades do not break these dependencies,
and that updates to these related projects do not break builds.

Note: New major versions of TypeScript are not immediately
supported by projects such as eslint, prettier, typescript-eslint,
etc. Our policy is to wait until these projects fully support
the new version of TypeScript, and/or without emitting warnings during these tests, before publishing.

### A note about versioning

Strict semver is a little complicated, as TypeScript itself does not adhere to semver. So our "best effort" policy is:

- Each update to the minimum Node target (e.g., Node 18 to Node 20), or a change to a major compiler output option
  (e.g. `module`, `target` or `moduleResolution`) will result in a new major version of this module.
  We coordinate this with whatever the latest LTS version of Node is currently supported by Amazon Lambda,
  Google Cloud Functions, and Azure Functions.
- Each new "major" version of TypeScript (e.g. `5.7.x` to `5.8.x`) will result in a new minor version of this module.
- A new minor update of TypeScript (e.g. `5.7.2` to `5.7.3`) or a key dependency (e.g., Node `22.11` to Node `22.14`) _may_ result in a patch.

Bear in mind, any update of TypeScript can potentially break your build. But hopefully in a way that's useful.

### Installation

```shell
npm add -D @checkdigit/typescript-config
```

Note: you do not need to explicitly install TypeScript itself, as the most recent supported version comes in as a
peer dependency of `@checkdigit/typescript-config`.

Make sure your project's `tsconfig.json` extends `@checkdigit/typescript-config`.

### Example `tsconfig.json`

```json
{
  "extends": "@checkdigit/typescript-config"
}
```

Note this configuration has `moduleResolution` set to `bundler`.
This requires the use of the `builder` command
to produce working code for deployment.

## License

MIT
