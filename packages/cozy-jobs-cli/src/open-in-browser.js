/* eslint no-console: off */

const open = require('open')
const os = require('os')
const fs = require('fs')
const path = require('path')

/**
 * Save the given html or cheerio object in tmp file and open it in the browser
 */
global.openInBrowser = $ => {
  let html = null

  if (typeof $ === 'string') {
    html = $
  } else if ($ && $.html()) {
    html = $.html()
  } else {
    throw new Error(`Invalid html or cheerio object given to openInBrowser`)
  }

  const tmpFile = path.join(os.tmpdir(), 'cozy-run-standalone-open-file.html')
  fs.writeFileSync(tmpFile, html)
  open(tmpFile, { wait: false })
  console.log(`${tmpFile} should be opened in your browser...`)
}
