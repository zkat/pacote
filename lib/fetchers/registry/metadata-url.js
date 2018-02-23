'use strict'

const url = require('url')

module.exports = metadataUrl
function metadataUrl (registry, name) {
  const normalized = registry.slice(-1) !== '/'
  ? registry + '/'
  : registry
  return url.resolve(normalized, name)
}

