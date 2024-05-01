// typescript/typescript-5.5.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

describe('typescript-5.5', () => {
  it('inferred type predicates', () => {
    interface Bird {
      commonName: string;
    }
    const nationalBirds: Map<string, Bird> = new Map();
    nationalBirds.set('USA', { commonName: 'Bald Eagle' });
    function getNames(countries: string[]) {
      const birds = countries.map((country) => nationalBirds.get(country)).filter((bird) => bird !== undefined);
      const result: string[] = [];
      for (const bird of birds) {
        result.push(bird.commonName); // pre-5.5, errors with TS18048: bird is possibly undefined
      }
      return result;
    }
    assert.deepEqual(getNames(['USA', 'Canada']), ['Bald Eagle']);
  });

  it('control flow narrowing for constant indexed accesses', () => {
    function f1(obj: Record<string, unknown>, key: string) {
      if (typeof obj[key] === 'string') {
        return obj[key].toUpperCase(); // pre-5.5, errors with TS2571: Object is of type unknown
      }
      return '';
    }
    assert.deepEqual(f1({ a: 'hello' }, 'a'), 'HELLO');
    assert.deepEqual(f1({ a: 'hello' }, 'b'), '');
  });

  /*
   * it('regular expression syntax checking', () => { ... })
   *
   * Note: we cannot test syntax checking for regular expressions in this test suite, since esbuild errors
   * on these invalid regex literals already.  But here are examples of some new regex syntax errors in 5.5:
   *
   * let myRegex = /@robot(\s+(please|immediately)))? do some task/;
   * //                                            ~
   * // error!
   * // Unexpected ')'. Did you mean to escape it with backslash?
   *
   * let myRegex = /@typedef \{import\((.+)\)\.([a-zA-Z_]+)\} \3/u;
   * //                                                        ~
   * // error!
   * // This backreference refers to a group that does not exist.
   * // There are only 2 capturing groups in this regular expression.
   *
   * let myRegex = /@typedef \{import\((?<importPath>.+)\)\.(?<importedEntity>[a-zA-Z_]+)\} \k<namedImport>/;
   * //                                                                                        ~~~~~~~~~~~
   * // error!
   * // There is no capturing group named 'namedImport' in this regular expression.
   */
});
