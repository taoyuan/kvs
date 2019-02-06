"use strict";

const batch = ["common-bucket"];

export = function(getStore) {
  batch.forEach(test => {
    require("./" + test)(getStore);
  });
};
