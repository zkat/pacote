var hostedGitInfo = require('hosted-git-info')
var optCheck = require('../../util/opt-check')
var request = require('../../registry/request')

module.exports = tarball
function tarball (spec, opts) {
  opts = optCheck(opts)
  return request.stream(tarballURI(spec), spec.hosted.type, opts)
}

// TODO - this requires a new hosted-git-info
function tarballURI (spec) {
  return hostedGitInfo.fromUrl(spec.hosted.ssh).tarball()
}
