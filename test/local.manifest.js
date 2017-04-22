var npmlog = require('npmlog')
var path = require('path')
var test = require('tap').test

npmlog.level = process.env.LOGLEVEL || 'silent'
var OPTS = {
  log: npmlog
}

var manifest = require('../manifest')

test('basic local manifest read', function (t) {
  var p = path.join(__dirname, './fixtures/has-shrinkwrap.tgz')
  manifest(p, OPTS, function (err, pkg) {
    if (err) { throw err }
    t.ok(pkg, 'got a package manifest')
    t.equal(pkg.name, 'test', 'parsed and read correctly')
    t.equal(pkg._shrinkwrap.name, 'test', 'got a shrinkwrap')
    t.done()
  })
})

test('accepts `where` opt to specify base for parsing')
