const parseDate = str => {
  const [day, month, year] = str.split('-').map(x => parseInt(x, 10))
  try {
    return new Date(year, month - 1, day).toISOString()
  } catch (e) {
    console.warn(`${str} is not a valid date`) // eslint-disable-line no-console
    throw e
  }
}

const parseAmount = x => parseFloat(x, 10)
const parseBool = x => (x == 'true' ? true : false)
const parseStr = x => x

const operationLineSpec = [
  ['_id', parseStr],
  ['date', parseDate],
  ['label', parseStr],
  ['amount', parseAmount],
  ['automaticCategoryId', parseStr]
]

const billLineSpec = [
  ['_id', parseStr],
  ['amount', parseAmount],
  ['groupAmount', parseAmount],
  ['originalAmount', parseAmount],
  ['originalDate', parseDate],
  ['date', parseDate],
  ['isRefund', parseBool],
  ['vendor', parseStr],
  ['type', parseStr]
]

const mkLineParser = spec => line => {
  if (typeof line !== 'string') {
    return line
  }
  const splitted = line.split(/\s*\|\s*/)
  const obj = {}
  try {
    spec.forEach(([attr, parser], i) => {
      if (splitted[i] !== 'undefined' && splitted[i] && splitted[i].length) {
        obj[attr] = parser(splitted[i])
      }
    })
  } catch (e) {
    console.warn('Error while parsing', line, e) // eslint-disable-line no-console
    throw e
  }
  return obj
}

const parseBillLine = mkLineParser(billLineSpec)
const parseOperationLine = mkLineParser(operationLineSpec)

const wrapAsFetchJSONResult = documents => {
  return {
    rows: documents.map(x => {
      if (!x._id) {
        throw new Error('doc without id' + x)
      }
      return { id: x._id, doc: x }
    })
  }
}

module.exports = { parseBillLine, parseOperationLine, wrapAsFetchJSONResult }
