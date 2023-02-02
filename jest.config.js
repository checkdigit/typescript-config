// jest-preset.js

export default {
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};

// export default {
//   transform: {
//     '^.+\\.ts$': [
//       'esbuild-jest',
//       {
//         sourcemap: true,
//         platform: 'node',
//         format: 'esm',
//         bundle: true,
//       },
//     ],
//   },
//   collectCoverageFrom: ['<rootDir>/src/**', '!<rootDir>/src/**/*.spec.ts'],
//   testMatch: ['<rootDir>/src/**/*.spec.ts'],
// };
