# checkdigit/typescript-config 

[![MIT License](https://img.shields.io/github/license/checkdigit/typescript-config)](https://github.com/checkdigit/typescript-config/blob/master/LICENSE.txt)
[![David](https://status.david-dm.org/gh/checkdigit/typescript-config.svg)](https://status.david-dm.org/gh/checkdigit/typescript-config.svg)

Copyright (c) 2021 [Check Digit, LLC](https://checkdigit.com)

### Introduction

This module contains the standard Check Digit Typescript configuration.
- requires Node 14 or above
- emits ES2020
- all compiler options set for maximum strictness

### Installation

```
npm add -D typescript
npm add -D @checkdigit/typescript-config
```

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
