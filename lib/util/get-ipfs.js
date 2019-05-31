'use strict'

const ipfsClient = require('ipfs-http-client')

let node

const getIpfs = (opts) => {
  if (!opts['ipfs-url']) {
    const err = new Error('Please specify an IPFS daemon to connect to, e.g. --ipfs-url=/ip4/127.0.0.1/tcp/5001 or npm config set ipfs-url /ip4/127.0.0.1/tcp/5001')
    err.code = 'ENOIPFSURL'

    throw err
  }

  if (!node) {
    node = ipfsClient(opts['ipfs-url'])
  }

  return node
}

module.exports = getIpfs
