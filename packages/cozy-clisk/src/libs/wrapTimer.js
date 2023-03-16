/**
 * Create a wrapTimer function with given defaults as options
 *
 * @param {WrapTimerOptions} defaults
 * @returns {Function} - wrapTimer function
 */
export const wrapTimerFactory = defaults => {
  return (obj, name, options = {}) => {
    return wrapTimer(obj, name, { ...defaults, ...options })
  }
}

/**
 * Wrap any async method of an object to display it's time of execution
 *
 * @param {object} obj - The object which will be considered as `this`
 * @param {string} name - The name of the method to wrap
 * @param {WrapTimerOptions} [options] - Options object
 * @returns {Function} - Wrapped async function
 */
export const wrapTimer = (obj, name, options = {}) => {
  const {
    displayName = name,
    // eslint-disable-next-line no-console
    logFn = console.log.bind(console),
    suffixFn = null
  } = options
  const fn = obj[name]
  if (!fn) {
    throw new Error(
      `${name} cannot be found on ${obj.name || obj.constructor.name}`
    )
  }
  return async function () {
    const start = Date.now()
    const res = await fn.apply(this, arguments)
    const end = Date.now()
    let suffix = suffixFn ? ' ' + suffixFn(arguments) : ''
    logFn(
      `⌛ ${displayName}${suffix} took ${Math.round((end - start) / 10) / 100}s`
    )
    return res
  }
}

/**
 * @typedef WrapTimerOptions
 * @property {string} [options.displayName] - Name which will be displayed in the final log
 * @property {Function} [options.logFn] - logging function. Defaults to console.log
 * @property {Function} [options.suffixFn] - function which will be called with method arguments which return a suffix to the name of the method
 */
