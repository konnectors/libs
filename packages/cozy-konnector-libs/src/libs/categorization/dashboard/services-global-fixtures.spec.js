const fs = require('fs')
const path = require('path')

const allowedFallbackCategories = require('./allowed_wrong_categories.json')
const {
  softRequire,
  fmtManualCategorizations,
  fmtResultsCSV
} = require('./helpers')
const cat2name = require('./tree.json')
const { fetchParameters } = require('../globalModel/parameters')
const { categorize } = require('../index')
const { fetchTransactionsWithManualCat } = require('../localModel/parameters')

jest.mock('../localModel/parameters')
jest.mock('../globalModel/parameters')

const fixturePath = path.join(__dirname, 'fixtures')

const BACKUP_DIR = process.env.BACKUP_DIR || '/tmp/'
const IT_IS_A_TEST = process.env.IT_IS_A_TEST

const globalModelJSON = softRequire('./bank_classifier_nb_and_voc.json')
const xOrDescribe = globalModelJSON ? describe : xdescribe

let cozyInstances
if (IT_IS_A_TEST) {
  cozyInstances = ['flotest60.cozy.rocks']
} else {
  cozyInstances = [
    'francoistest1.mycozy.cloud',
    'flotest60.cozy.rocks',
    'anonymous1.mycozy.cloud',
    'fabien.mycozy.cloud'
  ]
}

const GLOBAL_MODEL_THRESHOLD = 0.25

const METHOD_BI = 'BI'
const METHOD_GLOBAL_COZY = 'globalModel'

const STATUS_OK = 'WELL_CATEGORIZED'
const STATUS_OK_FALLBACK = 'ALMOST_WELL_CATEGORIZED'
const STATUS_KO = 'BADLY_CATEGORIZED'
const STATUS_UNCATEGORIZED = 'NOT_CATEGORIZED'

const ICONE_OK = '✅'
const ICONE_OK_FALLBACK = '🆗'
const ICONE_OK_BI = '☑️'
const ICONE_KO = '❌'
const ICONE_UNCATEGORIZED = '⚠️'
const ICONE_BI = 'BI'
const ICONE_GLOBAL_MODEL = '☁️'

// Prepare the historized tracking
const today = new Date()
let dd = today.getDate()
let mm = today.getMonth() + 1
const yyyy = today.getFullYear()
if (dd < 10) {
  dd = '0' + dd
}
if (mm < 10) {
  mm = '0' + mm
}

let csvWriter
const setCsvWriter = () => {
  const createCsvWriter = require('csv-writer').createObjectCsvWriter
  const csvPath = path.join(BACKUP_DIR, `results-${yyyy}-${mm}-${dd}.csv`)
  csvWriter = createCsvWriter({
    path: csvPath,
    header: [
      { id: 'manCat', title: 'Manual recategorization' },
      { id: 'method', title: 'Used model' },
      { id: 'status', title: 'Status' },
      { id: 'amount', title: 'Amount' },
      { id: 'label', title: 'Label' },
      { id: 'catNameDisplayed', title: 'Category displayed' },
      { id: 'catNameTrue', title: 'True category' },
      { id: 'cozyId', title: 'Id of Cozy' }
    ]
  })
}

const checkCategorization = transactions => {
  return transactions.map(op => {
    const trueCatId = op.trueCategoryId || '0'
    let displayedCatId
    let method
    let proba
    if (op.cozyCategoryProba >= GLOBAL_MODEL_THRESHOLD) {
      displayedCatId = op.cozyCategoryId
      method = METHOD_GLOBAL_COZY
      proba = op.cozyCategoryProba
    } else {
      displayedCatId = op.automaticCategoryId
      method = METHOD_BI
      proba = 1
    }
    // embed results informations
    op.method = method
    op.usedProba = proba
    op.catNameTrue = cat2name[trueCatId]
    op.catNameDisplayed = cat2name[displayedCatId]
    // output final status
    let status
    // check result as seen by user
    if (trueCatId === '0') {
      // special status if the op was not categorized at all
      status = STATUS_UNCATEGORIZED
    } else {
      // get the allowed fallback categories for the true category
      const fallbackCategories = allowedFallbackCategories[trueCatId]
      if (displayedCatId === trueCatId) {
        status = STATUS_OK
      } else if (fallbackCategories.includes(displayedCatId)) {
        status = STATUS_OK_FALLBACK
      } else {
        status = STATUS_KO
      }
    }
    op.status = status
    return op
  })
}

const fmtAccuracy = accuracy => {
  const {
    nOperations,
    winGlobalModel,
    winBI,
    winFallbackGlobalModel,
    winFallbackBI,
    loseGlobalModel,
    loseBI,
    nUncategorized
  } = accuracy
  const nWin = winBI + winGlobalModel
  const nWinFallback = winFallbackBI + winFallbackGlobalModel
  const nLose = loseBI + loseGlobalModel
  let summaryStr = `On ${nOperations} operations:
    \t- ${ICONE_OK} : ${((100 * nWin) / nOperations).toFixed(
    2
  )} % of good predictions
    \t\t-${ICONE_GLOBAL_MODEL} ${((winGlobalModel / nWin) * 100).toFixed(
    2
  )} % thanks to global model
    \t\t-${ICONE_BI} ${((winBI / nWin) * 100).toFixed(2)} % thanks to BI
    \t- ${ICONE_OK_FALLBACK} : ${((100 * nWinFallback) / nOperations).toFixed(
    2
  )} % of almost good predictions
    \t\t-${ICONE_GLOBAL_MODEL} ${(
    (winFallbackGlobalModel / nWinFallback) *
    100
  ).toFixed(2)} % thanks to global model
    \t\t-${ICONE_BI} ${((winFallbackBI / nWinFallback) * 100).toFixed(
    2
  )} % thanks to BI
    \t- ${ICONE_KO} : ${((100 * nLose) / nOperations).toFixed(
    2
  )} % of wrong predictions
    \t\t-${ICONE_GLOBAL_MODEL} ${((loseGlobalModel / nLose) * 100).toFixed(
    2
  )} % because of global model
    \t\t-${ICONE_BI} ${((loseBI / nLose) * 100).toFixed(2)} % because of BI
    \t- ${ICONE_UNCATEGORIZED} : ${(
    (100 * nUncategorized) /
    nOperations
  ).toFixed(2)} % were uncategorized`
  return summaryStr
}

const fmtFixtureSummary = (manualCategorizations, accuracy) => {
  const fmtedAccuracy = fmtAccuracy(accuracy)
  const fmtedManualCategorizations = fmtManualCategorizations(
    manualCategorizations
  )
  return [fmtedAccuracy, fmtedManualCategorizations]
}

const fmtResults = transactions => {
  const fmtedResults = transactions.map(op => {
    let fmtedResult = ''
    const { status, method } = op
    if (method === METHOD_BI) {
      fmtedResult += ICONE_BI
    } else if (method === METHOD_GLOBAL_COZY) {
      fmtedResult += ICONE_GLOBAL_MODEL
    }
    if (status === STATUS_UNCATEGORIZED) {
      fmtedResult += `${ICONE_UNCATEGORIZED}:`
      fmtedResult += ` (${op.amount}€)\t<<${op.label}>> was NOT categorized. ${op.method} predicted it as ${op.catNameDisplayed}`
    } else if (status === STATUS_OK) {
      fmtedResult += `${method === METHOD_BI ? ICONE_OK_BI : ICONE_OK}:`
      fmtedResult += ` (${op.amount}€)\t<<${op.label}>> - is properly predicted by ${op.method} as ${op.catNameTrue}`
    } else if (status === STATUS_OK_FALLBACK) {
      fmtedResult += `${
        method === METHOD_BI ? ICONE_OK_BI : ICONE_OK_FALLBACK
      }:`
      fmtedResult += ` (${op.amount}€)\t<<${op.label}>> - is ALMOST properly predicted by ${op.method} as ${op.catNameTrue} (user would have seen ${op.catNameDisplayed})`
    } else if (status === STATUS_KO) {
      fmtedResult += `${ICONE_KO}:`
      fmtedResult += ` (${op.amount}€)\t<<${op.label}>> - is NOT properly predicted by ${op.method} as ${op.catNameTrue} that said ${op.catNameDisplayed}`
    }
    return fmtedResult
  })
  return fmtedResults
}

const computeAccuracy = transactions => {
  const nOperations = transactions.length
  let winGlobalModel = 0
  let winBI = 0
  let winFallbackGlobalModel = 0
  let winFallbackBI = 0
  let loseGlobalModel = 0
  let loseBI = 0
  let nUncategorized = 0
  transactions.map(op => {
    const { status, method } = op
    switch (status) {
      case STATUS_OK:
        if (method === METHOD_BI) winBI += 1
        if (method === METHOD_GLOBAL_COZY) winGlobalModel += 1
        break
      case STATUS_OK_FALLBACK:
        if (method === METHOD_BI) winFallbackBI += 1
        if (method === METHOD_GLOBAL_COZY) winFallbackGlobalModel += 1
        break
      case STATUS_KO:
        if (method === METHOD_BI) loseBI += 1
        if (method === METHOD_GLOBAL_COZY) loseGlobalModel += 1
        break
      case STATUS_UNCATEGORIZED:
        nUncategorized += 1
        break
      default:
        break
    }
  })
  const accuracyByFrequency = {
    nOperations,
    winGlobalModel,
    winBI,
    winFallbackGlobalModel,
    winFallbackBI,
    loseGlobalModel,
    loseBI,
    nUncategorized
  }
  return accuracyByFrequency
}

xOrDescribe('Chain of predictions', () => {
  // prepare mock
  let manualCategorizations = []
  beforeEach(() => {
    fetchTransactionsWithManualCat.mockImplementation(() =>
      Promise.resolve(manualCategorizations)
    )
    // Mock global model
    fetchParameters.mockImplementation(() => Promise.resolve(globalModelJSON))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // prepare CSV
  let fixturesRecords = []

  // Prepare global metrics
  let nOperationsEveryFixtures = 0
  let winGlobalModelEveryFixtures = 0
  let winBIEveryFixtures = 0
  let winFallbackGlobalModelEveryFixtures = 0
  let winFallbackBIEveryFixtures = 0
  let loseGlobalModelEveryFixtures = 0
  let loseBIEveryFixtures = 0
  let nUncategorizedEveryFixtures = 0
  // prepare loop over fixtures
  for (let cozyId of cozyInstances) {
    // check if fixture exists
    const expectedPath = path.join(
      fixturePath,
      `${cozyId}-clean-transactions.bi.json`
    )
    let transactions
    try {
      transactions = require(expectedPath)['io.cozy.bank.operations']
    } catch (error) {
      transactions = undefined
    }
    // if fixture exists : continue
    ;(transactions ? it : xit)(
      `should correctly predict transactions of ${cozyId}`,
      async () => {
        manualCategorizations = transactions.filter(
          op => op.manualCategoryId !== undefined
        )

        await categorize(transactions)
        // parse results to check result
        const results = checkCategorization(transactions)
        // Format results
        const fmtedResults = fmtResults(results)
        // Format results for the historized CSV
        const fixtureCSV = fmtResultsCSV(results, cozyId)
        // Add an accuracy metrics
        const currentAccuracy = computeAccuracy(results)
        // Summary of the dataset
        const fixtureSummary = fmtFixtureSummary(
          manualCategorizations,
          currentAccuracy
        )
        // tests
        expect(fixtureSummary).toMatchSnapshot()
        expect(fmtedResults).toMatchSnapshot()
        fixturesRecords = fixturesRecords.concat(fixtureCSV)
        // update global metrics
        const {
          nOperations,
          winGlobalModel,
          winBI,
          winFallbackGlobalModel,
          winFallbackBI,
          loseGlobalModel,
          loseBI,
          nUncategorized
        } = currentAccuracy
        nOperationsEveryFixtures += nOperations
        winGlobalModelEveryFixtures += winGlobalModel
        winBIEveryFixtures += winBI
        winFallbackGlobalModelEveryFixtures += winFallbackGlobalModel
        winFallbackBIEveryFixtures += winFallbackBI
        loseGlobalModelEveryFixtures += loseGlobalModel
        loseBIEveryFixtures += loseBI
        nUncategorizedEveryFixtures += nUncategorized
      }
    )
  }

  it('Should give a correct global accuracy', () => {
    const globalAccuracy = {
      nOperations: nOperationsEveryFixtures,
      winGlobalModel: winGlobalModelEveryFixtures,
      winBI: winBIEveryFixtures,
      winFallbackGlobalModel: winFallbackGlobalModelEveryFixtures,
      winFallbackBI: winFallbackBIEveryFixtures,
      loseGlobalModel: loseGlobalModelEveryFixtures,
      loseBI: loseBIEveryFixtures,
      nUncategorized: nUncategorizedEveryFixtures
    }
    // add global metrics to snapshot
    expect(fmtAccuracy(globalAccuracy)).toMatchSnapshot()
  })

  it('Should write the historized CSV/txt onto the disk', async () => {
    fs.copyFile(
      path.join(
        __dirname,
        '__snapshots__',
        `${path.basename(__filename)}.snap`
      ),
      path.join(BACKUP_DIR, `results-global-${yyyy}-${mm}-${dd}.txt`),
      err => {
        if (err) {
          throw err
        }
      }
    )
    if (!csvWriter) setCsvWriter()
    try {
      await csvWriter.writeRecords(fixturesRecords)
      expect(true).toBeTruthy()
    } catch (err) {
      expect(false).toBeTruthy()
    }
  })
})
