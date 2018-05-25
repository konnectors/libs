/**
 * Declarative scraping.
 *
 * Describe your items attributes and where to find/parse them
 * instead of imperatively building them.
 *
 * Heavily inspired by [artoo] scraping method.
 *
 * [artoo]: https://medialab.github.io/artoo/
 */

const mkSpec = function(spec) {
  if (typeof spec === 'string') {
    return { sel: spec }
  } else {
    return spec
  }
}

/**
 * Scrape a cheerio object for properties
 *
 * @param  {cheerio} $ - Cheerio node which will be scraped
 * @param  {object|string} spec(s) - Options object describing what you want to scrape
 * @param  {string} [childSelector] -  If passed, scrape will return an array of items
 * @return {object|array} - Item(s) scraped
 * @example
 *
 * `scrape` can be used to declaratively extract data :
 *
 * - For one object :
 *
 * ```
 * const item = scrape($('#item'), {
 *   title: '.title',
 *   content: '.content'
 * })
 * ```
 *
 * - For a list of objects :
 *
 * ```
 * const items = scrape($('#content'), {
 *   title: '.title',
 *   content: '.content'
 * }, '.item')
 * ```
 *
 * For more power, you can use `object`s for each retriever :
 *
 * ```
 * const items = scrape($('#content'), {
 *   title: '.title',
 *   content: '.content',
 *   link: {
 *     sel: 'a',
 *     attr: 'href'
 *   },
 * }, '.item')
 * ```
 *
 * Here the `href` attribute of the `a` inside `.item`s would have been
 * put into the `link` attribute of the items returned by `scrape`.
 *
 * Available options :
 *
 * - `sel`: the CSS selector used to target the HTML node from which data will be scraped
 * - `attr`: the HTML attribute from which to extract data
 * - `parse`: function applied to the value extracted (`{ sel: '.price', parse: parseAmount }`)
 * - `fn`: if you need something more complicated than `attr`, you can use this function, it receives
 * the complete DOM node. `{ sel: '.person', fn: $node => $node.attr('data-name') + $node.attr('data-firstname') }`
 */
const scrape = ($, specs, childSelector) => {
  // Only one value shorthand
  if (
    typeof specs === 'string' ||
    (specs.sel && typeof specs.sel === 'string')
  ) {
    const { val } = scrape($, { val: specs })
    return val
  }

  // Several items shorthand
  if (childSelector !== undefined) {
    return Array.from(($.find || $)(childSelector)).map(e =>
      scrape($(e), specs)
    )
  }

  // Several properties "normal" case
  const res = {}
  Object.keys(specs).forEach(specName => {
    try {
      const spec = mkSpec(specs[specName])
      let data = spec.sel ? $.find(spec.sel) : $
      if (spec.index) {
        data = data.get(spec.index)
      }
      let val
      if (spec.fn) {
        val = spec.fn(data)
      } else if (spec.attr) {
        val = data.attr(spec.attr)
      } else {
        val = data
        val = val && val.text()
        val = val && val.trim()
      }
      if (spec.parse) {
        val = spec.parse(val)
      }
      res[specName] = val
    } catch (e) {
      console.warn('Could not parse for', specName)
      console.log(e)
    }
  })
  return res
}

module.exports = scrape
