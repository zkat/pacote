var optCheck = require('../../util/opt-check')
var request = require('../../registry/request')

module.exports = manifest
function manifest (spec, opts, cb) {
  opts = optCheck(opts)
  var h = spec.hosted
  request(h.directUrl, h.type, opts, function (err, manifest) {
    if (err) { return cb(err) }
    var srUrl = h.directUrl.replace(/package\.json/, 'npm-shrinkwrap.json')
    request(srUrl, h.type, opts, function (err, sr) {
      if (err && err.statusCode !== 404) { return cb(err) }
      manifest._shrinkwrap = sr
      cb(null, manifest)
    })
  })
}
