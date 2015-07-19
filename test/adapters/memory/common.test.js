"use strict";

describe('Memory adapter common features', function() {

    function getStore(cb) {
        var store = require('../../../').Store('memory');
        store.ready(function () {
            cb(store);
        });
    }

    require('../../common.batch.js')(getStore);

});