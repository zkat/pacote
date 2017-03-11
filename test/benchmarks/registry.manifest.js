'use strict'

const BB = require('bluebird')

const npmlog = require('npmlog')
const nock = require('nock')
const rimraf = require('rimraf')
const clearMemoized = require('../../lib/cache').clearMemoized

const manifest = require('../../manifest')

const npmManifest = require('./npm.json')
const eggplantManifest = require('./eggplant.json')

module.exports = (suite, CACHE) => {
  rimraf.sync(CACHE)
  npmlog.level = process.env.LOGLEVEL || 'silent'
  const OPTS = {
    registry: 'https://registry.npmjs.org/',
    cache: CACHE,
    log: npmlog,
    retry: {
      retries: 1,
      factor: 1,
      minTimeout: 1,
      maxTimeout: 10
    }
  }

  function makeReqs (srv) {
    srv.get(`/${npmManifest.name}`).times(Infinity).optionally().reply(200, JSON.stringify(npmManifest))
    srv.get(`/${eggplantManifest.name}`).times(Infinity).optionally().reply(200, JSON.stringify(eggplantManifest))
  }

  suite.add('pacote.manifest() small manifest', {
    defer: true,
    onStart () {
      const srv = nock(OPTS.registry)
      makeReqs(srv)
      this.srv = srv
      this.first = true
    },
    onComplete () {
      this.srv.done()
      rimraf.sync(CACHE)
      delete this.srv
    },
    fn (deferred) {
      if (this.first) {
        deferred.resolve()
        this.first = false
      }
      manifest('eggplant@latest').then(pkg => {
        deferred.resolve()
      }, err => { throw err })
    }
  })

  // suite.add('pacote.manifest() big manifest', {
  //   defer: true,
  //   onStart () {
  //     const srv = nock(OPTS.registry)
  //     makeReqs(srv)
  //     this.srv = srv
  //     this.first = true
  //   },
  //   onComplete () {
  //     this.srv.done()
  //     rimraf.sync(CACHE)
  //     delete this.srv
  //   },
  //   fn (deferred) {
  //     if (this.first) {
  //       deferred.resolve()
  //       this.first = false
  //     }
  //     manifest('npm@latest').then(pkg => {
  //       deferred.resolve()
  //     }, err => { throw err })
  //   }
  // })

  suite.add('pacote.manifest() 10x concurrent', {
    defer: true,
    onStart () {
      const srv = nock(OPTS.registry)
      makeReqs(srv)
      this.srv = srv
      this.first = true
    },
    onComplete () {
      this.srv.done()
      rimraf.sync(CACHE)
      delete this.srv
    },
    fn (deferred) {
      if (this.first) {
        deferred.resolve()
        this.first = false
      }
      let ps = []
      for (let i = 0; i < 10; i++) {
        ps.push(manifest('eggplant@latest'))
      }
      BB.all(ps).then(() => deferred.resolve())
    }
  })

  suite.add('pacote.manifest() disk cache small manifest', {
    defer: true,
    onStart () {
      const srv = nock(OPTS.registry)
      makeReqs(srv)
      this.srv = srv
      this.first = true
    },
    onComplete () {
      this.srv.done()
      rimraf.sync(CACHE)
      delete this.srv
    },
    fn (deferred) {
      if (this.first) {
        deferred.resolve()
        this.first = false
      }
      manifest('eggplant@latest', OPTS).then(pkg => {
        clearMemoized()
        deferred.resolve()
      }, err => { throw err })
    }
  })

  suite.add('pacote.manifest() disk cache big manifest', {
    defer: true,
    maxTime: 10,
    onStart () {
      const srv = nock(OPTS.registry)
      makeReqs(srv)
      this.srv = srv
      this.first = true
    },
    onComplete () {
      this.srv.done()
      rimraf.sync(CACHE)
      delete this.srv
    },
    fn (deferred) {
      if (this.first) {
        deferred.resolve()
        this.first = false
      }
      manifest('npm@latest', OPTS).then(pkg => {
        clearMemoized()
        deferred.resolve()
      }, err => { throw err })
    }
  })

  suite.add('pacote.manifest() memoized', {
    defer: true,
    onStart () {
      const srv = nock(OPTS.registry)
      makeReqs(srv)
      this.srv = srv
      this.first = true
    },
    onComplete () {
      this.srv.done()
      rimraf.sync(CACHE)
      delete this.srv
    },
    fn (deferred) {
      if (this.first) {
        deferred.resolve()
        this.first = false
      }
      manifest('eggplant@latest', OPTS).then(pkg => {
        deferred.resolve()
      }, err => { throw err })
    }
  })

  suite.add('pacote.manifest() memoized x10 concurrent', {
    defer: true,
    onStart () {
      const srv = nock(OPTS.registry)
      makeReqs(srv)
      this.srv = srv
      this.first = true
    },
    onComplete () {
      this.srv.done()
      rimraf.sync(CACHE)
      delete this.srv
    },
    fn (deferred) {
      if (this.first) {
        deferred.resolve()
        this.first = false
      }
      let ps = []
      for (let i = 0; i < 10; i++) {
        ps.push(manifest('eggplant@latest', OPTS))
      }
      BB.all(ps).then(() => deferred.resolve())
    }
  })
}
