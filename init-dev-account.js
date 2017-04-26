'use strict'

const cozy = require('./cozyclient')
const fs = require('fs')
const path = require('path')

// account id path is mandatory in the cli
let accountIdPath = process.argv[2]
if (accountIdPath) {
  accountIdPath = path.resolve(accountIdPath)
} else {
  console.log(`No account id file path parameter: ${accountIdPath}`)
  process.exit(0)
}

let fieldsFilePath = process.argv[3]
if (fieldsFilePath) {
  fieldsFilePath = path.resolve(fieldsFilePath)
} else {
  console.log(`Fields file not found : ${fieldsFilePath}
Please copy the env_fields.json.template file and fill the credentials`)
  process.exit(0)
}

if (!fs.existsSync(fieldsFilePath)) {
  console.log(`Fields file not found : ${fieldsFilePath}
Please copy the env_fields.json.template file and fill the credentials`)
  process.exit(0)
}

cozy.data.create('io.cozy.accounts', {
  account_type: 'dev_account',
  status: 'PENDING',
  auth: JSON.parse(fs.readFileSync(fieldsFilePath), 'utf-8')
})
.then(doc => {
  fs.writeFileSync(accountIdPath, doc._id)
  console.log('account created')
  console.log('account id in ' + accountIdPath)
})
.catch(err => console.log(err, 'there was an error'))
