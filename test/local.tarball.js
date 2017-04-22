var fs = require('fs')
var npmlog = require('npmlog')
var path = require('path')
var test = require('tap').test
var testDir = require('./util/test-dir')

var TMP = testDir(__filename)

npmlog.level = process.env.LOGLEVEL || 'silent'
var OPTS = {
  log: npmlog
}

var extract = require('../extract')

test('basic tarball extraction', function (t) {
  t.plan(2)
  var p = path.join(__dirname, './fixtures/has-shrinkwrap.tgz')
  var d = path.join(TMP, 'extracted')
  extract(p, d, OPTS, function (err) {
    if (err) { throw err }
    var pkg = path.join(d, 'package.json')
    var sr = path.join(d, 'npm-shrinkwrap.json')
    fs.readFile(pkg, 'utf8', function (err, data) {
      if (err) { throw err }
      t.equal(JSON.parse(data).name, 'test', 'got the package.json!')
    })
    fs.readFile(sr, 'utf8', function (err, data) {
      if (err) { throw err }
      t.equal(JSON.parse(data).name, 'test', 'got the shrinkwrap!')
    })
  })
})
