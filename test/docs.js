'use strict'

const BB = require('bluebird')

const fs = BB.promisifyAll(require('fs'))
const path = require('path')
const test = require('tap').test

test('all fixtures are documented', t => {
  // TODO - actually parse that table and make sure the
  //        important bits are documented?
  var readmePath = path.join(__dirname, 'fixtures', 'README.md')
  return BB.join(
    fs.readFileAsync(readmePath, 'utf8'),
    fs.readdirAsync(path.dirname(readmePath)),
    (text, files) => {
      files.forEach(function (f) {
        if (f !== 'README.md') {
          t.match(text, f, f + ' is mentioned.')
        }
      })
    }
  )
})

test('all toplevel api calls are documented')
