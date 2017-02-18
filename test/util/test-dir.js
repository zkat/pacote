'use strict'

var mkdirp = require('mkdirp')
var path = require('path')
var rimraf = require('rimraf')
var tap = require('tap')

var rmtries = process.platform === 'win32' ? 100 : 1

function rimrafSync (dir) {
  var i = 0
  do {
    i++
    try {
      return rimraf.sync(dir)
    } finally {
      if (i < rmtries) {
        continue
      }
    }
  } while (true)
}


var cacheDir = path.resolve(__dirname, '../cache')

module.exports = testDir
function testDir (filename) {
  var base = path.basename(filename, '.js')
  var dir = path.join(cacheDir, base)
  reset(dir)
  if (!process.env.KEEPCACHE) {
    tap.tearDown(function () {
      process.chdir(__dirname)
      rimrafSync(dir)
    })
    tap.afterEach(function (cb) {
      reset(dir)
      cb()
    })
  }
  return dir
}

module.exports.reset = reset
function reset (testDir) {
  process.chdir(__dirname)
  rimrafSync(testDir)
  mkdirp.sync(testDir)
  process.chdir(testDir)
}
