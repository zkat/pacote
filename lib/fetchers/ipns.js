'use strict'

const BB = require('bluebird')
const Fetcher = require('../fetch')
const PassThrough = require('stream').PassThrough
const pickManifest = require('npm-pick-manifest')
const pipe = BB.promisify(require('mississippi').pipe)
const optCheck = require('../util/opt-check')
const LRU = require('lru-cache')
const getIpfs = require('../util/get-ipfs')

const MEMO = new LRU({
  length: m => m._contentLength,
  max: 200 * 1024 * 1024, // 200MB
  maxAge: 30 * 1000 // 30s
})

const resolveIpnsName = (name, ipfs, opts) => {
  if (MEMO.has(name)) {
    return BB.resolve(MEMO.get(name))
  }

  opts.log.info('ipns', `Resolving ${name}`)

  let start = Date.now()

  return ipfs.name.resolve(name)
    .then(cid => {
      opts.log.info('ipns', `Resolved ${name} to ${cid}`, Date.now() - start, 'ms')

      MEMO.set(name, cid)

      return cid
    })
}

const fetchIPNS = module.exports = Object.create(null)

Fetcher.impl(fetchIPNS, {
  clearMemoized () {
    MEMO.reset()
  },

  packument (spec, opts) {
    opts = optCheck(opts)

    const ipfs = getIpfs(opts)
    const result = spec.rawSpec.match(/.*:\/\/([a-zA-Z0-9]*)#?(.*)/)
    const name = result[1]

    return resolveIpnsName(name, ipfs, opts)
      .then(cid => ipfs.cat(cid))
      .then(buf => JSON.parse(buf.toString()))
  },

  manifest (spec, opts) {
    opts = optCheck(opts)

    const result = spec.rawSpec.match(/.*:\/\/([a-zA-Z0-9]*)#?(.*)/)
    let version = result[2]

    return this.packument(spec, opts)
      .then(packument => {
        if (!version) {
          if (packument['dist-tags'] && packument['dist-tags'].latest) {
            version = packument['dist-tags'].latest
          } else {
            version = '*'
          }
        }

        return pickManifest(packument, version, {
          defaultTag: opts.defaultTag,
          enjoyBy: opts.enjoyBy,
          includeDeprecated: opts.includeDeprecated
        })
      })
  },

  tarball (spec, opts) {
    const stream = new PassThrough()

    this.manifest(spec, opts)
      .then(manifest => {
        return pipe(this.fromManifest(
          manifest, spec, opts
        ), stream)
      })
      .catch(err => stream.emit('error', err))

    return stream
  },

  fromManifest (manifest, spec, opts) {
    opts = optCheck(opts)

    const ipfs = getIpfs(opts)

    if (!manifest.dist.cid) {
      const err = new Error(`No CID found for ${manifest.name}@${manifest.version}`)
      err.code = 'ENOCID'

      throw err
    }

    return ipfs.catReadableStream(`/ipfs/${manifest.dist.cid}`)
  }
})
