const debug = require('debug')
const util = require('util')
const baseLog = debug.log
debug.log = function () {
  const str = JSON.stringify({
    'type': 'debug',
    'namespace': this.namespace,
    'message': util.format.apply(util, arguments)
  }) + '\n'
  baseLog(str)
}

debug.enable('*')
