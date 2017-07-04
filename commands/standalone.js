'use strict'

process.env.NODE_ENV = 'standalone'
if (!process.env.DEBUG) process.env.DEBUG = '*'

process.env.COZY_FIELDS = '{}'

require(require('path').resolve('index.js'))
