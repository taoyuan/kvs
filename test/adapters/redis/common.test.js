"use strict";

describe('Redis adapter common features', function() {

    function getStore(cb) {
        var store = require('../../../').Store('redis', {db: 2});
        store.ready(function () {
            cb(store);
        });
    }

    require('../../common.batch.js')(getStore);

});