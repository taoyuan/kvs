import {kvsTestAll} from '../suite-all';

describe('testlab', function () {
  it('should export test suite', function () {
    expect(kvsTestAll).toBeInstanceOf(Function);
  });
});
