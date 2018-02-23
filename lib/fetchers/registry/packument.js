'use strict'

const BB = require('bluebird')

const fetch = require('./fetch')
const LRU = require('lru-cache')
const optCheck = require('../../util/opt-check')
const pickRegistry = require('./pick-registry')
const metadataUrl = require('./metadata-url')
const ssri = require('ssri')

// Corgis are super cute. 🐕🐶
const CORGI_DOC = 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
const JSON_DOC = 'application/json'

module.exports = packument;
function packument (spec, opts) {
  opts = optCheck(opts)

  const registry = pickRegistry(spec, opts)
  const uri = metadataUrl(registry, spec.escapedName)

  return fetchPackument(uri, registry, spec, opts)
}

module.exports.fetchPackument = fetchPackument
function fetchPackument (uri, registry, spec, opts) {
  const mem = pickMem(opts)
  if (mem && !opts.preferOnline && mem.has(uri)) {
    return BB.resolve(mem.get(uri))
  }

  return fetch(uri, registry, Object.assign({
    headers: {
      'pacote-req-type': 'packument',
      'pacote-pkg-id': `registry:${spec.name}`,
      accept: opts.fullMetadata ? JSON_DOC : CORGI_DOC
    },
    spec
  }, opts, {
    // Force integrity to null: we never check integrity hashes for manifests
    integrity: null
  })).then(res => res.json().then(packument => {
    packument._cached = decodeURIComponent(res.headers.has('x-local-cache'))
    packument._contentLength = +res.headers.get('content-length')
    // NOTE - we need to call pickMem again because proxy
    //        objects get reused!
    const mem = pickMem(opts)
    if (mem) {
      mem.set(uri, packument)
    }
    return packument
  }))
}

// TODO - make this an opt
const MEMO = new LRU({
  length: m => m._contentLength,
  max: 200 * 1024 * 1024, // 200MB
  maxAge: 30 * 1000 // 30s
})

module.exports.clearMemoized = clearMemoized
function clearMemoized () {
  MEMO.reset()
}

class ObjProxy {
  get (key) { return this.obj[key] }
  set (key, val) { this.obj[key] = val }
}

// This object is used synchronously and immediately, so
// we can safely reuse it instead of consing up new ones
const PROX = new ObjProxy()
function pickMem (opts) {
  if (!opts || !opts.memoize) {
    return MEMO
  } else if (opts.memoize.get && opts.memoize.set) {
    return opts.memoize
  } else if (typeof opts.memoize === 'object') {
    PROX.obj = opts.memoize
    return PROX
  } else {
    return null
  }
}

