const cat2name = require('./tree.json')

const softRequire = file => {
  try {
    return require(file)
  } catch (e) {
    return undefined
  }
}

const compare = (a, b) => {
  if (a.label < b.label) return -1
  if (a.label > b.label) return 1
  return 0
}

const fmtManualCategorizations = manualCategorizations => {
  const sortedManualCategorizations = manualCategorizations.sort(compare)
  let countOfManualCategorizations = {}
  // sum up every recategorizations
  for (const op of sortedManualCategorizations) {
    const key =
      op.label.slice(0, 15) + op.automaticCategoryId + '>' + op.manualCategoryId
    const operationsSummary = countOfManualCategorizations[key]
    if (operationsSummary) {
      countOfManualCategorizations[key] = {
        occurrence: operationsSummary.occurrence + 1,
        ...op
      }
    } else {
      countOfManualCategorizations[key] = { occurrence: 1, ...op }
    }
  }
  // display the summary
  let fmtedManualCategorizations = []
  for (const key of Object.keys(countOfManualCategorizations)) {
    const op = countOfManualCategorizations[key]
    const label = op.label
    const manualCategoryName = cat2name[op.manualCategoryId]
    const automaticCategoryName = cat2name[op.automaticCategoryId]
    const formatedStr = `\t${op.occurrence} x <<${label}>>\t mapped from ${automaticCategoryName} to ${manualCategoryName}`
    fmtedManualCategorizations.push(formatedStr)
  }
  const headOfSummary = [
    `${manualCategorizations.length} Manual categorization for this fixture`
  ]
  const summary = headOfSummary.concat(fmtedManualCategorizations)
  return summary
}

const fmtResultsCSV = (transactions, cozyId) => {
  const fmtedResults = transactions.map(op => {
    const { status, method, amount, label, catNameDisplayed, catNameTrue } = op
    let fmtedResult = {
      manCat: op.manualCategoryId !== undefined,
      method,
      status,
      amount,
      label,
      catNameDisplayed,
      catNameTrue,
      cozyId
    }
    return fmtedResult
  })
  return fmtedResults
}

module.exports = {
  softRequire,
  fmtManualCategorizations,
  fmtResultsCSV
}
