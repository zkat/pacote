'use strict'

const fetchPackument = require('./lib/fetch').packument
const optCheck = require('./lib/util/opt-check')
const pinflight = require('promise-inflight')
const npa = require('npm-package-arg')
const manifest = require('./manifest')

module.exports = packument
function packument (spec, opts) {
  opts = optCheck(opts)
  spec = typeof spec === 'string' ? npa(spec, opts.where) : spec

  const label = [
    spec.name,
    spec.saveSpec || spec.fetchSpec,
    spec.type,
    opts.cache,
    opts.registry,
    opts.scope
  ].join(':')
  return pinflight(label, () => {
    const startTime = Date.now()
    return fetchPackument(spec, opts).then(packument => {
      return finalizePackument(packument, spec, opts)
    }).then(packument => {
      const elapsedTime = Date.now() - startTime
      opts.log.silly('pacote', `${spec.type} manifest for ${spec.name}@${spec.saveSpec || spec.fetchSpec} fetched in ${elapsedTime}ms`)
      return packument
    })
  })
}

function finalizePackument (packument, spec, opts) {
  if (packument == null) {
    // Some fetchers may opt out of returning packument documents as they can't
    // produce meaningful results (packages referred by URL, tarballs). In that
    // case we fetch the corresponding manifest and create a packument out of
    // it.
    return manifest(spec, opts).then(manifest => {
      return {
        name: manifest.name,
        'dist-tags': {},
        versions: {[manifest.version]: manifest}
      }
    })
  } else {
    return packument
  }
}
