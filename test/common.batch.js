"use strict";

var batch = ['common-bucket'];

module.exports = function (getStore) {
  batch.forEach(function (test) {
    require('./' + test)(getStore);
  });
};
