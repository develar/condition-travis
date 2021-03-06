var proxyquire = require('proxyquire')
var test = require('tap').test
var SRError = require('@semantic-release/error')

var condition = proxyquire('./', {
  'travis-after-all': function (cb) {
    cb(0)
  }
})

test('raise errors in travis environment', function (t) {
  t.test('only runs on travis', function (tt) {
    tt.plan(2)

    condition({}, {env: {}}, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'ENOTRAVIS')
    })
  })

  t.test('not running on pull requests', function (tt) {
    tt.plan(2)
    condition({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_PULL_REQUEST: '105'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EPULLREQUEST')
    })
  })

  t.test('not running on tags', function (tt) {
    tt.plan(2)
    condition({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_PULL_REQUEST: 'false',
        TRAVIS_TAG: 'v1.0.0'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EGITTAG')
    })
  })

  t.test('only running on specified branch', function (tt) {
    tt.plan(5)

    condition({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.is(err, null)
    })

    condition({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'notmaster'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EBRANCHMISMATCH')
    })

    condition({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'foo'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EBRANCHMISMATCH')
    })
  })

  t.test('supports travis-after-all', function (tt) {
    tt.plan(8)

    proxyquire('./', {
      'travis-after-all': function (cb) {
        cb(0)
      }
    })({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.is(err, null)
    })

    proxyquire('./', {
      'travis-after-all': function (cb) {
        cb(2)
      }
    })({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'ENOBUILDLEADER')
    })

    proxyquire('./', {
      'travis-after-all': function (cb) {
        cb(1)
      }
    })({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'EOTHERSFAILED')
    })

    proxyquire('./', {
      'travis-after-all': function (cb) {
        cb('weird?')
      }
    })({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.ok(err instanceof SRError)
      tt.is(err.code, 'ETAAFAIL')
    })

    var error = {}
    proxyquire('./', {
      'travis-after-all': function (cb) {
        cb(null, error)
      }
    })({}, {
      env: {
        TRAVIS: 'true',
        TRAVIS_BRANCH: 'master'
      },
      options: {
        branch: 'master'
      }
    }, function (err) {
      tt.is(err, error)
    })
  })

  t.end()
})
