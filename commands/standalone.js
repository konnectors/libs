'use strict'

process.env.NODE_ENV = 'standalone'
if (!process.env.DEBUG) process.env.DEBUG = '*'

process.env.COZY_FIELDS = '{}'

const filename = process.argv[2] || 'index.js'
require(require('path').resolve(filename))
