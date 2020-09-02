import {StoreProvider} from './support';

const batch = ['common-bucket'];

export = function (getStore: StoreProvider) {
  batch.forEach(item => require('./' + item).test(getStore));
};
