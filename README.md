# typescript-config

### Installation

```
npm add -D @checkdigit/typescript
npm add -D @checkdigit/typescript-config
```

Make sure your project's `tsconfig.json` extends `@checkdigit/typescript`.

### Example `tsconfig.json`

```
{
  "extends": "@checkdigit/typescript",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "build"
  },
  "exclude": [
    "node_modules",
    "build",
    "dist",
    "serve"
  ]
}
```