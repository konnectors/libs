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
  if (typeof spec === "string") {
    return { sel: spec };
  } else {
    return spec;
  }
};

/**
 * Scrape a cheerio object for properties
 *
 * @param  {cheerio} $ - Cheerio node which will be scraped
 * @param  {object|string} spec(s) - Options object describing what you want to scrape
 * @param  {string} [childSelector] -  If passed, scrape will return an array of items
 * @return {object|array} - Item(s) scraped
 */
const scrape = ($, specs, childSelector) => {
  // Only one value shorthand
  if (
    typeof specs === "string" ||
    (specs.sel && typeof specs.sel === "string")
  ) {
    const { val } = scrape($, { val: specs });
    return val;
  }

  // Several items shorthand
  if (childSelector !== undefined) {
    return Array.from(($.find || $)(childSelector)).map(e => scrape($(e), specs));
  }

  // Several properties "normal" case
  const res = {};
  Object.keys(specs).forEach(specName => {
    const spec = mkSpec(specs[specName]);
    let data = spec.sel ? $.find(spec.sel) : $;
    if (spec.index) {
      data = data.get(spec.index);
    }
    let val;
    if (spec.fn) {
      val = spec.fn(data);
    } else if (spec.attr) {
      val = data.attr(spec.attr);
    } else {
      val = data.text().trim();
    }
    if (spec.parse) {
      val = spec.parse(val);
    }
    res[specName] = val;
  });
  return res;
};

module.exports = scrape;
