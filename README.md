# typescript-config 

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
    "dist",
    "serve"
  ]
}
```
