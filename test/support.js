"use strict";

var chai = require('chai');
chai.Assertion.includeStack = true;
var assert = chai.assert;
var Store = require('../').Store;

var support = {
    random: {
        string: function (str_len) {
            str_len = str_len || 8;
            var chars = "abcdefghiklmnopqrstuvwxyz";
            var random_str = '';
            for (var i = 0; i < str_len; i++) {
                var rnum = Math.floor(Math.random() * chars.length);
                random_str += chars.substring(rnum, rnum + 1);
            }
            return random_str;
        }
    },

    assertBetween: function (actual, lower, upper) {
        assert.ok(actual >= lower, "Expected " + actual + " to be >= " + lower);
        assert.ok(actual <= upper, "Expected " + actual + " to be <= " + upper);
    },

    assertWithin: function (actual, expected, delta) {
        var lower = expected - delta;
        var upper = expected + delta;
        this.assertBetween(actual, lower, upper);
    },

    store: function (adapter) {
        return function () {
            return Store(adapter);
        }
    }
};

module.exports = support;
