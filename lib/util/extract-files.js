var finished = require('mississippi').finished
var gunzip = require('./gunzip-maybe')
var pipe = require('mississippi').pipe
var pipeline = require('mississippi').pipeline

var tar = require('tar-stream')

module.exports = extractFiles
function extractFiles (pkgStream, files, opts, cb) {
  if (typeof files === 'string') {
    files = [files]
  }
  files = files.map(function (f) { return 'package/' + f })
  var extract = tar.extract()

  var unzipped = pipeline(gunzip(), extract)

  var found = {}
  extract.on('entry', function onEntry (header, fileStream, next) {
    if (files.indexOf(header.name) !== -1) {
      var data = ''
      fileStream.on('data', function (d) { data += d })

      finished(fileStream, function (err) {
        if (err) { return extract.emit('error', err) }
        found[header.name.replace('package/', '')] = data
        files = files.filter(function (f) { return f !== header.name })
        if (files.length === 0) {
          unzipped.unpipe()
          cb(null, found)
        } else {
          next()
        }
      })
    } else {
      // Not a shrinkwrap. Autodrain this entry, and move on to the next.
      fileStream.resume()
      next()
    }
  })

  // Any other streams that `pkgStream` is being piped to should
  // remain unaffected by this, although there might be confusion
  // around backpressure issues.
  pipe(pkgStream, unzipped, function (err) {
    if (files.length) { cb(err, found, files) }
  })
}
