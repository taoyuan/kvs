import {kvsTestBuckets} from './suite-bucket';

const suites = [kvsTestBuckets];

export function kvsTestAll(provider: Function) {
  for (const suite of suites) {
    suite(provider);
  }
}
