# checkdigit/typescript-config 

[![MIT License](https://img.shields.io/github/license/checkdigit/typescript-config)](https://github.com/checkdigit/typescript-config/blob/master/LICENSE.txt)
[![David](https://status.david-dm.org/gh/checkdigit/typescript-config.svg)](https://status.david-dm.org/gh/checkdigit/typescript-config.svg)

Copyright (c) 2022 [Check Digit, LLC](https://checkdigit.com)

### Introduction

This module contains the standard Check Digit Typescript configuration.
- requires Node 16 or above
- emits ES2022
- uses the new tsconfig `module` type of `node16`.  This specifies that whether commonjs or ESM is emitted is dependent
  on the value of the `type` field in `package.json`.  If not supplied, the default value is `commonjs`.
  Set `"type": "module"` to emit ESM.
- all compiler options set for maximum strictness

#### A note about versioning

Strict semver is a little complicated, as Typescript itself does not adhere to semver.  So our "best effort" policy is:

- Each new target (e.g. `ES2019` to `ES2020`) will result in a new major version of this module.  We coordinate this
  with whatever the latest LTS version of Node is currently supported by Amazon Lambda, Google Cloud Functions
  and Azure Functions.
- Each new major version of Typescript (e.g. `4.2.x` to `4.3.x`) will result in a new minor version of this module.
- Each new minor update of Typescript (e.g. `4.3.1` to `4.3.2`) will result in a new patch version of this module.

Bear in mind, any update of Typescript can potentially break your build.  But hopefully in a way that's useful.

### Installation

```
npm add -D @checkdigit/typescript-config
```

Note: you do not need to explicitly install Typescript itself, as it comes in as a peer dependency of `@checkdigit/typescript-config`.

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
    "build",
    "dist"
  ]
}
```

## License

MIT
