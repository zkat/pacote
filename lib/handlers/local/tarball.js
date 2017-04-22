var fs = require('fs')

module.exports = tarball
function tarball (spec, opts) {
  return fs.createReadStream(spec.spec)
}
