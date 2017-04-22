var extractFiles = require('../../util/extract-files')
var tarball = require('./tarball')

module.exports = manifest
function manifest (spec, opts, cb) {
  var stream = tarball(spec, opts)
  stream.on('data', function () {})
  extractFiles(stream, [
    'package.json', 'npm-shrinkwrap.json'
  ], opts, function (err, files) {
    if (err) { return cb(err) }
    if (!files['package.json']) {
      return cb(new Error('no package.json found'))
    } else {
      try {
        var pkg = JSON.parse(files['package.json'])
      } catch (e) {
        return cb(e)
      }
      if (files['npm-shrinkwrap.json']) {
        try {
          var sr = JSON.parse(files['npm-shrinkwrap.json'])
        } catch (e) {
          return cb(e)
        }
        pkg._shrinkwrap = sr
      }
      cb(null, pkg)
    }
  })
}
