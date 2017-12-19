"use strict";

describe('Redis adapter common features', function () {

  function getStore(cb) {
    var store = require('../../../').Store('redis');
    store.ready(function () {
      cb(store);
    });
  }

  require('../../common.batch.js')(getStore);

});
