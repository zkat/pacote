'use strict'

const clearMemoized = require('..').clearMemoized
const npmlog = require('npmlog')
const test = require('tap').test
const testDir = require('./util/test-dir')
const tnock = require('./util/tnock')
const path = require('path')
const fs = require('fs')
const CACHE = testDir(__filename)
const packument = require('../packument')
const manifest = require('../manifest')
const tarball = require('../tarball')

npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
  cache: CACHE,
  registry: 'https://mock.reg',
  log: npmlog,
  retry: {
    retries: 1,
    factor: 1,
    minTimeout: 1,
    maxTimeout: 10
  },
  'ipfs-url': '/ip4/127.0.0.1/tcp/1234'
}

test('packument is unimplemented', t => {
  clearMemoized()

  return packument('ipfs://zdj7WhFBRwsWJJxzE7bBbFn5pLb3VfTLThfavMrdF9gNqbvxF', OPTS)
    .then(() => {
      throw new Error('this was not supposed to succeed')
    })
    .catch(err => {
      t.ok(err, 'correctly errored')
      t.notMatch(err.message, /not supposed to succeed/)
      t.match(err.message, /Not implemented/)
    })
})

test('resolves manifest from tarball', t => {
  clearMemoized()
  const srv = tnock(t, 'http://127.0.0.1:1234')
  const file = fs.readFileSync(path.resolve(__dirname, './fixtures/no-shrinkwrap.tgz'))

  srv.post('/api/v0/cat?arg=zdj7WhFBRwsWJJxzE7bBbFn5pLb3VfTLThfavMrdF9gNqbvxF&stream-channels=true')
    .once()
    .reply(200, file, {
      'x-stream-output': 1,
      'x-content-length': file.length,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })

  return manifest('ipfs://zdj7WhFBRwsWJJxzE7bBbFn5pLb3VfTLThfavMrdF9gNqbvxF', OPTS)
    .then((manifest) => {
      t.equal(manifest.version, '1.0.0')
    })
})

test('resolves a tarball from a CID', t => {
  clearMemoized()
  const srv = tnock(t, 'http://127.0.0.1:1234')
  const file = fs.readFileSync(path.resolve(__dirname, './fixtures/no-shrinkwrap.tgz'))

  srv.post('/api/v0/cat?arg=zdj7WhFBRwsWJJxzE7bBbFn5pLb3VfTLThfavMrdF9gNqbvxF&stream-channels=true')
    .once()
    .reply(200, file, {
      'x-stream-output': 1,
      'x-content-length': file.length,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })

  return tarball('ipfs://zdj7WhFBRwsWJJxzE7bBbFn5pLb3VfTLThfavMrdF9gNqbvxF', OPTS)
    .then(buf => {
      t.true(Buffer.isBuffer(buf), 'Fetched tarball')
      t.equal(file.length, buf.length, 'Fetched tarball')
    })
})

test('errors if no IPFS URL is specified', t => {
  clearMemoized()

  return tarball('ipfs://zdj7WhFBRwsWJJxzE7bBbFn5pLb3VfTLThfavMrdF9gNqbvxF', {
    'ipfs-url': null
  })
    .then(() => {
      throw new Error('this was not supposed to succeed')
    })
    .catch(err => {
      t.ok(err, 'correctly errored')
      t.notMatch(err.message, /not supposed to succeed/)
      t.equal(err.code, 'ENOIPFSURL', 'no IPFS URL was specified')
    })
})

test('throws an error if CID is invalid', t => {
  clearMemoized()

  return tarball('ipfs://not-a-valid-cid', OPTS)
    .then(() => {
      throw new Error('this was not supposed to succeed')
    })
    .catch(err => {
      t.ok(err, 'correctly errored')
      t.notMatch(err.message, /not supposed to succeed/)
    })
})
