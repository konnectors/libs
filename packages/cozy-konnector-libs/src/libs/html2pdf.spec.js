const cheerio = require('cheerio')

const { htmlToPDF, createCozyPDFDocument } = require('./html2pdf')

describe('htmlToPDF', () => {
  let pdf

  it('generate base documents', () => {
    pdf = createCozyPDFDocument('Generated for tests', 'https//example.com')
  })

  it('should handle simple table', () => {
    const $ = cheerio.load(`
      <div id="root">
        <table>
          <tr><td>A</td><td>B</td><td>C</td></tr>
          <tr><td>1</td><td>2</td><td>3</td></tr>
          <tr><td>1</td><td>2</td><td>3</td></tr>
          <tr><td>1</td><td>2</td><td>3</td></tr>
        </table>
      </div>
    `)

    htmlToPDF($, pdf, $('#root'))
  })

  it('should handle colspan', () => {
    const $ = cheerio.load(`
      <div id="root">
        <table>
          <tr><td>A</td><td>B</td><td>C</td></tr>
          <tr><td colspan=2>1</td><td>3</td></tr>
          <tr><td>1</td><td colspan=2>2</td></tr>
          <tr><td colspan=3>1</td></tr>
        </table>
      </div>
    `)

    htmlToPDF($, pdf, $('#root'))
  })

  it('should handle missing cell', () => {
    const $ = cheerio.load(`
      <div id="root">
        <table>
          <tr><td>A</td><td>B</td><td>C</td></tr>
          <tr><td colspan=2>1</td></tr>
          <tr><td >1</td></tr>
        </table>
      </div>
    `)

    htmlToPDF($, pdf, $('#root'))
  })

  it('should handle colspan in header', () => {
    const $ = cheerio.load(`
      <div id="root">
        <table>
          <tr><td colspan=2>A</td><td>C</td></tr>
          <tr><td>1</td><td>2</td><td>3</td></tr>
        </table>
      </div>
    `)

    htmlToPDF($, pdf, $('#root'))
  })

  test('colspan too big is handle', () => {
    const $ = cheerio.load(`
      <div id="root">
        <table>
          <tr>
            <td>1</td>
            <td>2</td>
          </tr>
          <tr><td colspan=6>A</td></tr>
        </table>
      </div>
    `)

    htmlToPDF($, pdf, $('#root'))
  })
  test('colspan too big is handle', () => {
    const $ = cheerio.load(`
      <div id="root">
        <table>
          <tr>
            <td>1</td>
            <td>2</td>
          </tr>
          <tr>
            <td>
              <dl>
                <dt>term1</dt><dd>definition1</dd>
                <dt>term2</dt> <dd>definition2</dd>
              </dl>
            </td>
          </tr>
          <tr><td colspan=6>A</td></tr>
        </table>
      </div>
    `)

    htmlToPDF($, pdf, $('#root'))
  })

  test('caption in table', () => {
    const $ = cheerio.load(`
      <div id="root">
        <table class="my-order-total__table">
          <caption class="my-order-total__title">text</caption>
        </table>
      </div>
    `)

    htmlToPDF($, pdf, $('#root'))
  })
})
