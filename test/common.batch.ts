"use strict";

const batch = ["common-bucket"];

export = function(getStore) {
  batch.forEach(item => require("./" + item).test(getStore));
};
