'use strict'

const path = require('path')
const tar = require('tar')

module.exports = extractStream
function extractStream (dest, opts) {
  opts = opts || {}
  const sawIgnores = new Set()
  return tar.x({
    cwd: dest,
    // Use endsWith rather than match with regex. Should be faster.
    filter: (name, entry) => !entry.header.type.endsWith('link'),
    strip: 1,
    onwarn: msg => opts.log && opts.log.warn('tar', msg),
    uid: opts.uid,
    gid: opts.gid,
    onentry (entry) {
      // Only lowerCase once.
      const entryType = entry.type.toLowerCase()
      if (entryType === 'file') {
        entry.mode = opts.fmode & ~(opts.umask || 0)
      } else if (entryType === 'directory') {
        entry.mode = opts.dmode & ~(opts.umask || 0)
      }

      // Note: This mirrors logic in the fs read operations that are
      // employed during tarball creation, in the fstream-npm module.
      // It is duplicated here to handle tarballs that are created
      // using other means, such as system tar or git archive.
      if (entryType === 'file') {
        const base = path.basename(entry.path)
        if (base === '.npmignore') {
          sawIgnores.add(entry.path)
        } else if (base === '.gitignore') {
          // Cut off last 10 chars (.gitignore) and replace with .npmignore.
          // substring should be faster than regex.
          const npmignore = entry.path.slice(0, -10) + '.npmignore'
          if (!sawIgnores.has(npmignore)) {
            // Rename, may be clobbered later.
            entry.path = npmignore
          }
        }
      }
    }
  })
}
