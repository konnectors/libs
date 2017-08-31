'use strict'

process.env.NODE_ENV = 'standalone'
if (!process.env.DEBUG) process.env.DEBUG = '*'

process.env.COZY_FIELDS = JSON.stringify({
  folder_to_save: '.'
})

const filename = process.argv[2] || 'index.js'

// assign default value of replay to bloody which cancels it
process.env.REPLAY = process.env.REPLAY ? process.env.REPLAY : 'bloody'
require('replay')

require(require('path').resolve(filename))
