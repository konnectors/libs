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

It also has a terminate method which allows to stop the connector with a specific error code :

```
this.terminate('LOGIN_FAILED')
```

### log ( type, message, label, namespace )

Use it to log messages in your konnector. Typical types are

* `debug`
* `warning`
* `info`
* `error`
* `ok`

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

* `cheerio`  will parse automatically the `response.body` in a cheerio instance

```js
req = request({ cheerio: true })
req('http://github.com', $ => {
  const repos = $('#repo_listing .repo')
})
```

* `jar` is passed to `request` options. Remembers cookies for future use.
* `json` will parse the `response.body` as JSON

### retry

A shortcut the the [bluebird-retry](https://www.npmjs.com/package/bluebird-retry)

```
const { retry } = require('cozy-konnector-libs')

```

### filterData ( entries, doctype, options )

Used not to duplicate data.

* `options` :
    - `keys` : List of keys used to check that two items are the same. By default it is set to `['id']'.
    - `index` : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
    - `selector` : Mango request to get records. Default is built from the keys `{selector: {_id: {"$gt": null}}}` to get all the records.

### saveFiles ( files\[\], folderPath, options? )

The goal of this function is to save the given files in the given folder via the Cozy API.

- `files` is an array of `{ fileurl, filename }` :

  + fileurl: The url of the file. This attribute is mandatory or
    this item will be ignored
  + filename : The file name of the item written on disk. This attribute is optional and as default value, the
    file name will be "smartly" guessed by the function. Use this attribute if the guess is not smart
  enough for you.

- `folderPath` (string) is relative to the main path given by the `cozy-collect` application to the connector. If the connector is run
in standalone mode, the main path is the path of the connector.

- `options` (object) is optional. Possible options :

  + `timeout` (timestamp) can be used if your connector
  needs to fetch a lot of files and if the the stack does not give enough time to your connector to
  fetch it all. It could happen that the connector is stopped right in the middle of the download of
  the file and the file will be broken. With the `timeout` option, the `saveFiles` function will check
  if the timeout has passed right after downloading each file and then will be sure to be stopped
  cleanly if the timeout is not too long. And since it is really fast to check that a file has
  already been downloaded, on the next run of the connector, it will be able to download some more
  files, and so on. If you want the timeout to be in 10s, do `Date.now() + 10*1000`. You can try it in the previous code.

### addData ( entries, doctype )

Creates the records in the given doctype.

### saveBills ( entries, folderPath, options )

Combines the features of `saveFiles`, `filterData`, `addData` and  `linkBankOperations`. Will create `io.cozy.bills` objects. The default deduplication keys are `['date', 'amount', 'vendor']`.

`options` is passed directly to `saveFiles`, `filterData`, `addData` and `linkBankOperations`.

### linkBankOperations ( entries, doctype, fields, options = {} )

This function will soon move to a dedicated service. You should not use it.
The goal of this function is to find links between bills and bank operations.

### ⚠ Permissions

Please note that some classes require some permissions:

- `io.cozy.accounts` for the `BaseKonnector` class (`GET` only)
- `io.cozy.files` to save files
- `io.cozy.bills` to save bills
- `io.cozy.bank.operations` for `linkBankOperations`
