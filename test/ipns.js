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

const MANIFEST = {
  '_id': 'express',
  '_rev': '1032-3bae071fc67636b1c05ae7c9ebbe64e1',
  'name': 'express',
  'description': 'Fast, unopinionated, minimalist web framework',
  'dist-tags': {
    'latest': '3.2.0',
    'next': '4.0.0'
  },
  'versions': {
    '0.0.1': {
      'name': 'some-module',
      'version': '0.0.1',
      'dist': {
        'integrity': 'sha512-3FW+yXzYCViXf6Ty9TN9IKLW+rC8qok3ktS4hS1FILAEnMnfnDpQ+23rZVvWC0Ul1alYpJXx7xSBSBp073970g==',
        'shasum': '879bfb1bd52834646a9d8c3a773863c36e4d494c',
        'tarball': 'https://registry.npmjs.com/some-module/-/some-module-0.0.1.tgz',
        'cid': 'bafybeifprvl6iqk3oj6a5yw74v5ggmdc7orhyibcz437kdont5tuj7pjfa'
      }
    },
    '1.0.0': {
      'name': 'some-module',
      'version': '1.0.0',
      'dist': {
        'integrity': 'sha512-3FW+yXzYCViXf6Ty9TN9IKLW+rC8qok3ktS4hS1FILAEnMnfnDpQ+23rZVvWC0Ul1alYpJXx7xSBSBp073970g==',
        'shasum': '879bfb1bd52834646a9d8c3a773863c36e4d494c',
        'tarball': 'https://registry.npmjs.com/some-module/-/some-module-1.0.0.tgz',
        'cid': 'bafybeifprvl6iqk3oj6a5yw74v5ggmdc7orhyibcz437kdont5tuj7pjfb'
      }
    },
    '1.1.0': {
      'name': 'some-module',
      'version': '1.1.0',
      'dist': {
        'integrity': 'sha512-3FW+yXzYCViXf6Ty9TN9IKLW+rC8qok3ktS4hS1FILAEnMnfnDpQ+23rZVvWC0Ul1alYpJXx7xSBSBp073970g==',
        'shasum': '879bfb1bd52834646a9d8c3a773863c36e4d494c',
        'tarball': 'https://registry.npmjs.com/some-module/-/some-module-1.1.0.tgz',
        'cid': 'bafybeifprvl6iqk3oj6a5yw74v5ggmdc7orhyibcz437kdont5tuj7pjfc'
      }
    },
    '2.0.0': {
      'name': 'some-module',
      'version': '2.0.0',
      'dist': {
        'integrity': 'sha512-3FW+yXzYCViXf6Ty9TN9IKLW+rC8qok3ktS4hS1FILAEnMnfnDpQ+23rZVvWC0Ul1alYpJXx7xSBSBp073970g==',
        'shasum': '879bfb1bd52834646a9d8c3a773863c36e4d494c',
        'tarball': 'https://registry.npmjs.com/some-module/-/some-module-2.0.0.tgz'
      }
    },
    '3.2.0': {
      'name': 'some-module',
      'version': '3.2.0',
      'dist': {
        'integrity': 'sha512-3FW+yXzYCViXf6Ty9TN9IKLW+rC8qok3ktS4hS1FILAEnMnfnDpQ+23rZVvWC0Ul1alYpJXx7xSBSBp073970g==',
        'shasum': '879bfb1bd52834646a9d8c3a773863c36e4d494c',
        'tarball': 'https://registry.npmjs.com/some-module/-/some-module-1.1.0.tgz',
        'cid': 'bafybeifprvl6iqk3oj6a5yw74v5ggmdc7orhyibcz437kdont5tuj7pjfd'
      }
    },
    '4.0.0': {
      'name': 'some-module',
      'version': '4.0.0',
      'dist': {
        'integrity': 'sha512-3FW+yXzYCViXf6Ty9TN9IKLW+rC8qok3ktS4hS1FILAEnMnfnDpQ+23rZVvWC0Ul1alYpJXx7xSBSBp073970g==',
        'shasum': '879bfb1bd52834646a9d8c3a773863c36e4d494c',
        'tarball': 'https://registry.npmjs.com/some-module/-/some-module-1.1.0.tgz',
        'cid': 'bafybeifprvl6iqk3oj6a5yw74v5ggmdc7orhyibcz437kdont5tuj7pjfe'
      }
    }
  }
}

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

test('returns a packument from an IPNS name', t => {
  clearMemoized()
  const srv = tnock(t, 'http://127.0.0.1:1234')

  srv.post('/api/v0/name/resolve?arg=QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, {
      Path: '/ipfs/QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2FQmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, MANIFEST, {
      'x-stream-output': 1,
      'x-content-length': JSON.stringify(MANIFEST).length,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })

  return packument('ipns://QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF#^1.0.0', OPTS)
    .then(packument => {
      t.deepequal(packument, MANIFEST, 'Retrieved packument')
    })
})

test('resolves a manifest from an IPNS name', t => {
  clearMemoized()
  const srv = tnock(t, 'http://127.0.0.1:1234')

  srv.post('/api/v0/name/resolve?arg=QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, {
      Path: '/ipfs/QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2FQmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, MANIFEST, {
      'x-stream-output': 1,
      'x-content-length': JSON.stringify(MANIFEST).length,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2Fbafybeifprvl6iqk3oj6a5yw74v5ggmdc7orhyibcz437kdont5tuj7pjfc&stream-channels=true')
    .once()
    .reply(200, Buffer.from([0, 1, 2, 3]), {
      'x-stream-output': 1,
      'x-content-length': 4,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })

  return manifest('ipns://QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF#^1.0.0', OPTS)
    .then(pkg => {
      t.equal(pkg.version, '1.1.0', 'Retrieved latest version')
    })
})

test('fetches a tarball from an IPNS name', t => {
  clearMemoized()
  const srv = tnock(t, 'http://127.0.0.1:1234')
  const file = fs.readFileSync(path.resolve(__dirname, './fixtures/no-shrinkwrap.tgz'))

  srv.post('/api/v0/name/resolve?arg=QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, {
      Path: '/ipfs/QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2FQmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, MANIFEST, {
      'x-stream-output': 1,
      'x-content-length': JSON.stringify(MANIFEST).length,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2Fbafybeifprvl6iqk3oj6a5yw74v5ggmdc7orhyibcz437kdont5tuj7pjfc&stream-channels=true')
    .once()
    .reply(200, file, {
      'x-stream-output': 1,
      'x-content-length': file.length,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })

  return tarball('ipns://QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF#^1.0.0', OPTS)
    .then(buf => {
      t.ok(Buffer.isBuffer(buf), 'Fetched a tarball')
      t.equal(file.length, buf.length, 'Fetched tarball')
    })
})

test('caches IPNS lookups', t => {
  clearMemoized()
  const srv = tnock(t, 'http://127.0.0.1:1234')

  srv.post('/api/v0/name/resolve?arg=QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, {
      Path: '/ipfs/QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2FQmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, MANIFEST, {
      'x-stream-output': 1,
      'x-content-length': JSON.stringify(MANIFEST).length,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2FQmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, MANIFEST, {
      'x-stream-output': 1,
      'x-content-length': JSON.stringify(MANIFEST).length,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2Fbafybeifprvl6iqk3oj6a5yw74v5ggmdc7orhyibcz437kdont5tuj7pjfc&stream-channels=true')
    .once()
    .reply(200, Buffer.from([0, 1, 2, 3]), {
      'x-stream-output': 1,
      'x-content-length': 4,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2Fbafybeifprvl6iqk3oj6a5yw74v5ggmdc7orhyibcz437kdont5tuj7pjfc&stream-channels=true')
    .once()
    .reply(200, Buffer.from([0, 1, 2, 3]), {
      'x-stream-output': 1,
      'x-content-length': 4,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })

  return manifest('ipns://QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF#^1.0.0', OPTS)
    .then(() => manifest('ipns://QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF#^1.0.0', OPTS))
})

test('throws an error if IPNS name is invalid', t => {
  clearMemoized()
  const srv = tnock(t, 'http://127.0.0.1:1234')
  srv.post('/api/v0/name/resolve?arg=not&stream-channels=true')
    .once()
    .reply(500, {
      Message: 'not a valid proquint string',
      Code: 0,
      Type: 'error'
    })

  return manifest('ipns://not-a-valid-cid', OPTS)
    .then(() => {
      throw new Error('this was not supposed to succeed')
    })
    .catch(err => {
      t.ok(err, 'correctly errored')
      t.notMatch(err.message, /not supposed to succeed/)
      t.match(err.message, 'not a valid proquint string')
    })
})

test('throws an error if no CID is available for the requested version', t => {
  clearMemoized()
  const srv = tnock(t, 'http://127.0.0.1:1234')
  srv.post('/api/v0/name/resolve?arg=QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, {
      Path: '/ipfs/QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2FQmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, MANIFEST, {
      'x-stream-output': 1,
      'x-content-length': JSON.stringify(MANIFEST).length,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })

  return manifest('ipns://QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF#2.0.0', OPTS)
    .then(() => {
      throw new Error('this was not supposed to succeed')
    })
    .catch(err => {
      t.ok(err, 'correctly errored')
      t.notMatch(err.message, /not supposed to succeed/)
      t.match(err.code, 'ENOCID')
    })
})

test('resolves the latest version available if no version is specified', t => {
  clearMemoized()
  const srv = tnock(t, 'http://127.0.0.1:1234')
  srv.post('/api/v0/name/resolve?arg=QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, {
      Path: '/ipfs/QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2FQmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, MANIFEST, {
      'x-stream-output': 1,
      'x-content-length': JSON.stringify(MANIFEST).length,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2Fbafybeifprvl6iqk3oj6a5yw74v5ggmdc7orhyibcz437kdont5tuj7pjfd&stream-channels=true')
    .once()
    .reply(200, Buffer.from([0, 1, 2, 3]), {
      'x-stream-output': 1,
      'x-content-length': 4,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })

  return manifest('ipns://QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF', OPTS)
    .then((manifest) => {
      t.equal(manifest.version, '3.2.0')
    })
})

test('resolves the versions by tag', t => {
  clearMemoized()
  const srv = tnock(t, 'http://127.0.0.1:1234')
  srv.post('/api/v0/name/resolve?arg=QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, {
      Path: '/ipfs/QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2FQmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF&stream-channels=true')
    .once()
    .reply(200, MANIFEST, {
      'x-stream-output': 1,
      'x-content-length': JSON.stringify(MANIFEST).length,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })
  srv.post('/api/v0/cat?arg=%2Fipfs%2Fbafybeifprvl6iqk3oj6a5yw74v5ggmdc7orhyibcz437kdont5tuj7pjfe&stream-channels=true')
    .once()
    .reply(200, Buffer.from([0, 1, 2, 3]), {
      'x-stream-output': 1,
      'x-content-length': 4,
      'transfer-encoding': 'chunked',
      trailer: 'X-Stream-Error'
    })

  return manifest('ipns://QmZfVvXNWwwYcbMikEHwJSt2SGg3tEWs45MBeUsdChBArF#next', OPTS)
    .then((manifest) => {
      t.equal(manifest.version, '4.0.0')
    })
})
