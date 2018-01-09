"use strict";

const {Store} = require('../../..');

describe('Redis adapter common features', function () {

  function getStore(cb) {
    const store = new Store('redis');
    store.ready(function () {
      cb(store);
    });
  }

  require('../../common.batch.js')(getStore);

});
