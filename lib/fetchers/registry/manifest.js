'use strict'

const BB = require('bluebird')

const fetch = require('./fetch')
const optCheck = require('../../util/opt-check')
const pickManifest = require('npm-pick-manifest')
const pickRegistry = require('./pick-registry')
const ssri = require('ssri')
const metadataUrl = require('./metadata-url')
const fetchPackument = require('./packument').fetchPackument

module.exports = manifest
function manifest (spec, opts) {
  opts = optCheck(opts)

  const registry = pickRegistry(spec, opts)
  const uri = metadataUrl(registry, spec.escapedName)

  return getManifest(uri, registry, spec, opts).then(manifest => {
    return annotateManifest(uri, registry, manifest)
  })
}

function getManifest (uri, registry, spec, opts) {
  return fetchPackument(uri, registry, spec, opts).then(packument => {
    try {
      return pickManifest(packument, spec.fetchSpec, {
        defaultTag: opts.defaultTag,
        includeDeprecated: opts.includeDeprecated
      })
    } catch (err) {
      if (err.code === 'ETARGET' && packument._cached && !opts.offline) {
        opts.log.silly(
          'registry:manifest',
          `no matching version for ${spec.name}@${spec.fetchSpec} in the cache. Forcing revalidation`
        )
        opts.preferOffline = false
        opts.preferOnline = true
        return fetchPackument(uri, registry, spec, opts).then(packument => {
          return pickManifest(packument, spec.fetchSpec, {
            defaultTag: opts.defaultTag
          })
        })
      } else {
        throw err
      }
    }
  })
}

function annotateManifest (uri, registry, manifest) {
  const shasum = manifest.dist && manifest.dist.shasum
  manifest._integrity = manifest.dist && manifest.dist.integrity
  manifest._shasum = shasum
  if (!manifest._integrity && shasum) {
    // Use legacy dist.shasum field if available.
    manifest._integrity = ssri.fromHex(shasum, 'sha1').toString()
  }
  manifest._resolved = (
    manifest.dist && manifest.dist.tarball
  )
  if (!manifest._resolved) {
    const err = new Error(
      `Manifest for ${manifest.name}@${manifest.version} from ${uri} is missing a tarball url (pkg.dist.tarball). Guessing a default.`
    )
    err.code = 'ENOTARBALL'
    err.manifest = manifest
    if (!manifest._warnings) { manifest._warnings = [] }
    manifest._warnings.push(err.message)
    manifest._resolved =
    `${registry}/${manifest.name}/-/${manifest.name}-${manifest.version}.tgz`
  }
  return manifest
}
