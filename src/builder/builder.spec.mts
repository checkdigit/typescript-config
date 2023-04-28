// builder/builder.spec.mts

// @ts-expect-error
import builder from './builder';

describe('test builder', () => {
  it('should build', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await builder('../test/lib', 'hello');
    expect(true).toBe(true);
  });
});
