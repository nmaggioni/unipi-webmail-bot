const crypto = require('crypto');
let hashes = [];

function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

function push(hash) {
  hashes.push(hash);
}

function includes(hash) {
  return hashes.includes(hash);
}

module.exports = {
  md5: md5,
  setSeen: push,
  isSeen: includes
};
