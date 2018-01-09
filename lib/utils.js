const PromiseA = require('bluebird');

function createPromiseCallback() {
  let cb;
  const promise = new PromiseA(function(resolve, reject) {
    cb = function(err, data) {
      if (err) return reject(err);
      return resolve(data);
    };
  });
  cb.promise = promise;
  return cb;
}

exports.createPromiseCallback = createPromiseCallback;
