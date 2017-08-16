## API

### BaseKonnector( fetcher )

The class from which all the connectors must inherit. It takes a fetch function in parameter that must return a `Promise`.

```
const { BaseKonnector } = require('cozy-konnector-libs')

module.exports = new BaseKonnector(function fetch () {
  // use this to access the instance of the konnector to
  // store any information that needs to be passed to
  // different stages of the konnector
})
```

Its role is twofold :

* Make the link between account data and konnector
* Handle errors

### log ( type, message, label, namespace )

Use it to log messages in your konnector. Typical types are

* debug
* warning
* info
* error
* ok

They will be colored in development mode. In production mode, those logs are formatted in JSON to be interpreted by the stack and possibly sent to the client. `error` will stop the konnector.

```js
logger = log('my-namespace')
logger('debug', '365 bills')
// my-namespace : debug : 365 bills
logger('info', 'Page fetched')
// my-namespace : info : Page fetched
```

### cozyClient

This is a [cozy-client-js](https://cozy.github.io/cozy-client-js/) instance already initialized and ready to use

### request

This is a function which returns an instance of [request-promise](https://www.npmjs.com/package/request-promise) initialized with
defaults often used in connector development.


```js
// Showing defaults
req = request({
  cheerio: false,
  jar: true,
  json: true
})
```

* `cheerio` parameter will parse automatically the `response.body` in a cheerio instance

```js
req = request({ cheerio: true })
req('http://github.com', $ => {
  const repos = $('#repo_listing .repo')
})
```

### retry

A shortcut the the [bluebird-retry](https://www.npmjs.com/package/bluebird-retry)

```
const { retry } = require('cozy-konnector-libs')

```

### Utility functions

- `saveFiles`: Saves a list files in the cozy checking already existing files
- `filterData` : Filters out already existing records according to a given list of keys.
- `addData`: Creates records in the given doctype
- `linkBankOperations`: Adds a link to a files in a list of bank operations. Will be moved to a service soon.
- `saveBills`: Combines the features of `saveFiles`, `filterData`, `addData` and  `linkBankOperations` and specialized to Bills

Please note that some permissions are required to use some of those classes:

- `io.cozy.accounts` for the `BaseKonnector` class (`GET` only)
- `io.cozy.files` to allow the connector to save files
- `io.cozy.bills` to allow the connector to save bills data in this doctype
- `io.cozy.bank.operations` for the `linkBankOperation` function
