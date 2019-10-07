const { URL } = require('url')

const computeWidth = $table => {
  let out = 0
  const tds = $table
    .find('tr')
    .first()
    .find('td,th')
  for (var i = 0; i < tds.length; i++) {
    out += parseInt(tds.eq(i).attr('colspan')) || 1
  }
  return out
}

const makeLinkOpts = ($el, opts) => {
  if ($el.attr('href') === undefined) return undefined
  if ($el.attr('href').indexOf('javascript:') === 0) return undefined
  if ($el.attr('href').indexOf('#') === 0) return undefined
  return {
    link: new URL($el.attr('href'), opts.baseURL).toString(),
    color: '0x0000FF'
  }
}

function htmlToPDF($, frag, $parent, opts) {
  let pdf
  try {
    pdf = require('pdfjs')
  } catch (err) {
    throw new Error(
      'pdfjs dependency is missing. Please add it in your package.json'
    )
  }
  const helveticaBold = require('pdfjs/font/Helvetica-Bold')
  const helveticaEm = require('pdfjs/font/Helvetica-Oblique')
  opts = Object.assign(
    {
      baseURL: '',
      filter: () => true,
      txtOpts: {}
    },
    opts
  )
  const children = $parent.contents()
  let text = opts.text
  let parentDL = null
  const getText = () => {
    if (!text) text = frag.text('', opts.txtOpts)
    return text
  }
  children.each((i, el) => {
    if (el.nodeType === 3 && el.data.trim() !== '') {
      getText().add(el.data)
    } else if (el.nodeType === 1) {
      const $el = $(el)
      if (!opts.filter($el)) return
      switch (el.tagName) {
        case 'a':
          getText().add($el.text(), makeLinkOpts($el, opts))
          break

        case 'strong':
        case 'b':
          getText().add($el.text(), { font: helveticaBold })
          break

        case 'em':
          getText().add($el.text(), { font: helveticaEm })
          break

        case 'span':
          htmlToPDF($, frag, $el, Object.assign({}, opts, { text: text }))
          break

        case 'br':
          getText().br()
          break

        case 'i':
        case 'select':
        case 'input':
        case 'label':
        case 'form':
        case 'fieldset':
        case 'textarea':
        case 'button':
        case 'img':
        case 'script':
        case 'caption':
          // ignore
          break

        case 'table': {
          text = null
          let width = computeWidth($el)
          let tableState = {
            tableWidth: width
          }
          htmlToPDF(
            $,
            frag.table({
              widths: Array.from(Array(width), () => '*'),
              borderWidth: 1
            }),
            $el,
            Object.assign({}, opts, { tableState })
          )
          break
        }

        case 'tr': {
          text = null
          opts.tableState.colRemaining = opts.tableState.tableWidth
          let row = frag.row()
          htmlToPDF($, row, $el, opts)
          if (opts.tableState.colRemaining > 0) {
            row.cell({
              colspan: opts.tableState.colRemaining
            })
          }
          break
        }

        case 'dl':
          text = null
          htmlToPDF(
            $,
            frag.table({ widths: [5 * pdf.cm, null], borderWidth: 1 }),
            $el,
            {
              ...opts,
              tableState: {
                tableWidth: 2,
                colRemaining: 2
              }
            }
          )
          parentDL = null
          break

        case 'dt':
          if (!parentDL) {
            parentDL = frag
          } else {
            frag = parentDL
          }
          frag = frag.row()
        // fall through the rest of the procedure
        case 'dd':
        case 'th':
        case 'td': {
          text = null
          const colspan = Math.min(
            opts.tableState.tableWidth,
            parseInt($el.attr('colspan')) || 1
          )
          opts.tableState.colRemaining -= colspan
          htmlToPDF(
            $,
            frag.cell({
              padding: 5,
              colspan: colspan
            }),
            $el,
            opts
          )
          break
        }

        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
          text = null
          htmlToPDF(
            $,
            frag, //.cell({ paddingTop: 1 * pdf.cm }),
            $el,
            Object.assign({}, opts, {
              txtOpts: {
                fontSize: 30 - parseInt(el.tagName.replace('h', '')) * 2
              }
            })
          )
          break

        case 'div':
        case 'p':
        case 'ul':
          text = null
          htmlToPDF($, frag.cell(), $el, opts)
          break

        case 'thead':
        case 'tfoot':
        case 'tbody':
        case 'small':
        case 'li':
          text = null
          htmlToPDF($, frag, $el, opts)
          break

        default:
          text = null
          htmlToPDF($, frag, $el, opts)
      }
    }
  })
}

function createCozyPDFDocument(headline, url) {
  let pdf
  try {
    pdf = require('pdfjs')
  } catch (err) {
    throw new Error(
      'pdfjs dependency is missing. Please add it in your package.json'
    )
  }
  var doc = new pdf.Document()
  const cell = doc.cell({ paddingBottom: 0.5 * pdf.cm }).text()
  cell.add(headline, {
    font: require('pdfjs/font/Helvetica-Bold'),
    fontSize: 14
  })
  cell.add(url, {
    link: url,
    color: '0x0000FF'
  })
  return doc
}

module.exports = {
  htmlToPDF,
  createCozyPDFDocument
}
