'use strict'

const BB = require('bluebird')
const Fetcher = require('../fetch')
const getIpfs = require('../util/get-ipfs')
const CID = require('ipfs-http-client').CID
const PassThrough = require('stream').PassThrough

const fetchIPFS = module.exports = Object.create(null)

Fetcher.impl(fetchIPFS, {
  packument () {
    return BB.reject(new Error('Not implemented yet'))
  },

  manifest () {
    return BB.resolve(null)
  },

  tarball (spec, opts) {
    try {
      const ipfs = getIpfs(opts)
      const cid = new CID(spec.rawSpec.trim().replace('ipfs://', ''))

      return ipfs.catReadableStream(cid)
    } catch (err) {
      const stream = new PassThrough()
      stream.emit('error', err)

      return stream
    }
  },

  fromManifest (manifest, spec, opts) {
    return this.tarball(manifest || spec, opts)
  }
})
