## API

## Modules

<dl>
<dt><a href="#module_addData">addData</a></dt>
<dd><p>Saves the data into the cozy blindly without check.</p>
</dd>
<dt><a href="#module_cozyClient">cozyClient</a></dt>
<dd><p><a href="https://cozy.github.io/cozy-client-js/">cozy-client-js</a> instance already
initialized and ready to use.</p>
</dd>
<dt><a href="#module_hydrateAndFilter">hydrateAndFilter</a></dt>
<dd><p>Filters the passed array from data already present in the cozy so that there is
not duplicated data in the Cozy.</p>
</dd>
<dt><a href="#module_linkBankOperations">linkBankOperations</a></dt>
<dd><p>Finds links between bills and bank operations.</p>
</dd>
<dt><a href="#module_mkdirp">mkdirp</a></dt>
<dd></dd>
<dt><a href="#module_normalizeFilename">normalizeFilename</a></dt>
<dd><p>Returns the given name, replacing characters that could be an issue when
used in a filename with spaces.</p>
</dd>
<dt><a href="#module_saveBills">saveBills</a></dt>
<dd><p>Encapsulates the saving of Bills : saves the files, saves the new data, and associate the files
to an existing bank operation</p>
</dd>
<dt><a href="#module_saveFiles">saveFiles</a></dt>
<dd><p>Saves the given files in the given folder via the Cozy API.</p>
</dd>
<dt><a href="#module_signin">signin</a></dt>
<dd><p>Provides an handy method to log the user in,
on HTML form pages. On success, it resolves to a promise with a parsed body.</p>
</dd>
<dt><a href="#module_updateOrCreate">updateOrCreate</a></dt>
<dd><p>Creates or updates the given entries according to if they already
exist in the cozy or not</p>
</dd>
<dt><a href="#module_utils">utils</a></dt>
<dd><p>Small utilities helping to develop konnectors.</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#BaseKonnector">BaseKonnector</a></dt>
<dd><p>The class from which all the connectors must inherit.
It takes a fetch function in parameter that must return a <code>Promise</code>.
You need at least the <code>GET</code> permission on <code>io.cozy.accounts</code> in your manifest to allow it to
fetch account information for your connector.</p>
</dd>
<dt><a href="#Document">Document</a></dt>
<dd><p>Simple Model for Documents. Allows to specify
<code>shouldSave</code>, <code>shouldUpdate</code> as methods.</p>
<p>Has useful <code>isEqual</code> method</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#LOGIN_FAILED">LOGIN_FAILED</a> : <code>String</code></dt>
<dd><p>The konnector could not login</p>
</dd>
<dt><a href="#NOT_EXISTING_DIRECTORY">NOT_EXISTING_DIRECTORY</a> : <code>String</code></dt>
<dd><p>The folder specified as folder_to_save does not exist (checked by BaseKonnector)</p>
</dd>
<dt><a href="#VENDOR_DOWN">VENDOR_DOWN</a> : <code>String</code></dt>
<dd><p>The vendor&#39;s website is down</p>
</dd>
<dt><a href="#USER_ACTION_NEEDED">USER_ACTION_NEEDED</a> : <code>String</code></dt>
<dd><p>There was an unexpected error, please take a look at the logs to know what happened</p>
</dd>
<dt><a href="#FILE_DOWNLOAD_FAILED">FILE_DOWNLOAD_FAILED</a> : <code>String</code></dt>
<dd><p>There was a problem while downloading a file</p>
</dd>
<dt><a href="#SAVE_FILE_FAILED">SAVE_FILE_FAILED</a> : <code>String</code></dt>
<dd><p>There was a problem while saving a file</p>
</dd>
<dt><a href="#DISK_QUOTA_EXCEEDED">DISK_QUOTA_EXCEEDED</a> : <code>String</code></dt>
<dd><p>Could not save a file to the cozy because of disk quota exceeded</p>
</dd>
<dt><a href="#CHALLENGE_ASKED">CHALLENGE_ASKED</a> : <code>String</code></dt>
<dd><p>It seems that the website requires a second authentification factor that we don’t support yet.</p>
</dd>
<dt><a href="#LOGIN_FAILED_TOO_MANY_ATTEMPTS">LOGIN_FAILED_TOO_MANY_ATTEMPTS</a> : <code>String</code></dt>
<dd><p>Temporarily blocked</p>
</dd>
<dt><a href="#USER_ACTION_NEEDED_OAUTH_OUTDATED">USER_ACTION_NEEDED_OAUTH_OUTDATED</a> : <code>String</code></dt>
<dd><p>Access refresh required</p>
</dd>
<dt><a href="#USER_ACTION_NEEDED_ACCOUNT_REMOVED">USER_ACTION_NEEDED_ACCOUNT_REMOVED</a> : <code>String</code></dt>
<dd><p>Unavailable account</p>
</dd>
<dt><a href="#USER_ACTION_NEEDED_CHANGE_PASSWORD">USER_ACTION_NEEDED_CHANGE_PASSWORD</a> : <code>String</code></dt>
<dd><p>Unavailable account</p>
</dd>
<dt><a href="#USER_ACTION_NEEDED_PERMISSIONS_CHANGED">USER_ACTION_NEEDED_PERMISSIONS_CHANGED</a> : <code>String</code></dt>
<dd><p>Password update required</p>
</dd>
<dt><a href="#USER_ACTION_NEEDED_CGU_FORM">USER_ACTION_NEEDED_CGU_FORM</a> : <code>String</code></dt>
<dd><p>The user needs to accept a CGU form before accessing the rest of the website</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#mkSpec">mkSpec()</a></dt>
<dd><p>Declarative scraping.</p>
<p>Describe your items attributes and where to find/parse them
instead of imperatively building them.</p>
<p>Heavily inspired by <a href="https://medialab.github.io/artoo/">artoo</a> scraping method.</p>
</dd>
<dt><a href="#scrape">scrape($, spec(s), [childSelector])</a> ⇒ <code>object</code> | <code>array</code></dt>
<dd><p>Scrape a cheerio object for properties</p>
</dd>
</dl>

<a name="module_addData"></a>

## addData
Saves the data into the cozy blindly without check.

<a name="exp_module_addData--module.exports"></a>

### module.exports() ⏏
Saves the data into the cozy blindly without check.

You need at least the `POST` permission for the given doctype in your manifest, to be able to
use this function.

Parameters:

* `documents`: an array of objects corresponding to the data you want to save in the cozy
* `doctype` (string): the doctype where you want to save data (ex: 'io.cozy.bills')

```javascript
const documents = [
  {
    name: 'toto',
    height: 1.8
  },
  {
    name: 'titi',
    height: 1.7
  }
]

return addData(documents, 'io.cozy.height')
```

**Kind**: Exported function  
<a name="module_cozyClient"></a>

## cozyClient
[cozy-client-js](https://cozy.github.io/cozy-client-js/) instance already
initialized and ready to use.

<a name="exp_module_cozyClient--module.exports"></a>

### module.exports ⏏
[cozy-client-js](https://cozy.github.io/cozy-client-js/) instance already initialized and ready to use.

If you want to access cozy-client-js directly, this method gives you directly an instance of it,
initialized according to `COZY_URL` and `COZY_CREDENTIALS` environment variable given by cozy-stack
You can refer to the [cozy-client-js documentation](https://cozy.github.io/cozy-client-js/) for more information.

Example :

```javascript
const {cozyClient} = require('cozy-konnector-libs')

cozyClient.data.defineIndex('my.doctype', ['_id'])
```

**Kind**: Exported member  
<a name="module_hydrateAndFilter"></a>

## hydrateAndFilter
Filters the passed array from data already present in the cozy so that there is
not duplicated data in the Cozy.


* [hydrateAndFilter](#module_hydrateAndFilter)
    * [hydrateAndFilter()](#exp_module_hydrateAndFilter--hydrateAndFilter) ⏏
        * [~suitableCall()](#module_hydrateAndFilter--hydrateAndFilter..suitableCall)

<a name="exp_module_hydrateAndFilter--hydrateAndFilter"></a>

### hydrateAndFilter() ⏏
Filters the passed array from data already present in the cozy so that there is
not duplicated data in the Cozy.

You need at least the `GET` permission for the given doctype in your manifest, to be able to
use this function.

Parameters:

* `documents`: an array of objects corresponding to the data you want to save in the cozy
* `doctype` (string): the doctype where you want to save data (ex: 'io.cozy.bills')
* `options` :
   - `keys` (array) : List of keys used to check that two items are the same. By default it is set to `['id']'.
   - `index` (optionnal) : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
   - `selector` (optionnal object) : Mango request to get records. Default is built from the keys `{selector: {_id: {"$gt": null}}}` to get all the records.

```javascript
const documents = [
  {
    name: 'toto',
    height: 1.8
  },
  {
    name: 'titi',
    height: 1.7
  }
]

return hydrateAndFilter(documents, 'io.cozy.height', {
  keys: ['name']
}).then(filteredDocuments => addData(filteredDocuments, 'io.cozy.height'))

```

**Kind**: Exported function  
<a name="module_hydrateAndFilter--hydrateAndFilter..suitableCall"></a>

#### hydrateAndFilter~suitableCall()
Since we can use methods or basic functions for
`shouldSave` and `shouldUpdate` we pass the
appropriate `this` and `arguments`.

If `funcOrMethod` is a method, it will be called
with args[0] as `this` and the rest as `arguments`
Otherwise, `this` will be null and `args` will be passed
as `arguments`.

**Kind**: inner method of [<code>hydrateAndFilter</code>](#exp_module_hydrateAndFilter--hydrateAndFilter)  
<a name="module_linkBankOperations"></a>

## linkBankOperations
Finds links between bills and bank operations.

<a name="exp_module_linkBankOperations--module.exports"></a>

### module.exports() ⏏
Will soon move to a dedicated service. You should not use it.

Finds links between bills and bank operations.

**Kind**: Exported function  
<a name="module_mkdirp"></a>

## mkdirp
<a name="exp_module_mkdirp--module.exports"></a>

### module.exports ⏏
Creates a directory and its missing ancestors as needed.

Options :

- `...pathComponents`:  one or many path components to be joined

```javascript
await mkdirp('/foo') // Creates /foo
await mkdirp('/foo') // Does nothing as /foo already exists
await mkdirp('/bar/baz') // Creates /bar, then /bar/baz
await mkdirp('/foo/bar/baz') // Creates /foo/bar, then /foo/bar/baz, not /foo
await mkdirp('/') // Does nothing
await mkdirp('/qux', 'qux2/qux3', 'qux4') // Creates /qux, then /qux/qux2,
                                          // then /qux/qux2/qux3 and
                                          // finally /qux/qux2/qux3/qux4
```

The function will automatically add a leading slash when missing:

```javascript
await mkdirp('foo', 'bar') // Creates /foo, then /foo/bar
```

**Kind**: Exported member  
<a name="module_normalizeFilename"></a>

## normalizeFilename
Returns the given name, replacing characters that could be an issue when
used in a filename with spaces.

<a name="exp_module_normalizeFilename--normalizeFilename"></a>

### normalizeFilename() ⏏
Returns the given name, replacing characters that could be an issue when
used in a filename with spaces.

Replaced characters include:

- Those forbidden on one or many popular OS or filesystem: `<>:"/\|?*`
- Those forbidden by the cozy-stack `\0`, `\r` and `\n`
- Multiple spaces and/or tabs are replaced with a single space
- Leading & trailing spaces and/or tabs are removed

An exception will be thrown in case there is not any filename-compatible
character in the given name.

Parameters:

- `basename` is whatever string you want to generate the filename from
- `ext` is an optional file extension, with or without leading dot

```javascript
const { normalizeFilename } = require('cozy-konnector-libs')

const filename = normalizeFilename('*foo/bar: <baz> \\"qux"\t???', '.txt')
// `filename` === `foo bar baz qux.txt`
```

**Kind**: Exported function  
<a name="module_saveBills"></a>

## saveBills
Encapsulates the saving of Bills : saves the files, saves the new data, and associate the files
to an existing bank operation

<a name="exp_module_saveBills--module.exports"></a>

### module.exports() ⏏
Combines the features of `saveFiles`, `hydrateAndFilter`, `addData` and `linkBankOperations` for a
common case: bills.
Will create `io.cozy.bills` objects. The default deduplication keys are `['date', 'amount', 'vendor']`.
You need the full permission on `io.cozy.bills`, full permission on `io.cozy.files` and also
full permission on `io.cozy.bank.operations` in your manifest, to be able to use this function.

Parameters:

- `documents` is an array of objects with any attributes with some mandatory attributes :
  + `amount` (Number): the amount of the bill used to match bank operations
  + `date` (Date): the date of the bill also used to match bank operations
  + `vendor` (String): the name of the vendor associated to the bill. Ex: 'trainline'
  You can also pass attributes expected by `saveFiles`
  Please take a look at [io.cozy.bills doctype documentation](https://github.com/cozy/cozy-doctypes/blob/master/docs/io.cozy.bills.md)
- `fields` (object) this is the first parameter given to BaseKonnector's constructor
- `options` is passed directly to `saveFiles`, `hydrateAndFilter`, `addData` and `linkBankOperations`.

**Kind**: Exported function  
**Example**  
```javascript
const { BaseKonnector, saveBills } = require('cozy-konnector-libs')

module.exports = new BaseKonnector(function fetch (fields) {
  const documents = []
  // some code which fills documents
  return saveBills(documents, fields, {
    identifiers: ['vendor']
  })
})
```
<a name="module_saveFiles"></a>

## saveFiles
Saves the given files in the given folder via the Cozy API.

<a name="exp_module_saveFiles--saveFiles"></a>

### saveFiles() ⏏
Saves the files given in the fileurl attribute of each entries

You need the full permission on `io.cozy.files` in your manifest to use this function.

- `files` is an array of `{ fileurl, filename }` :

  + fileurl: The url of the file. This attribute is mandatory or
    this item will be ignored
  + filename : The file name of the item written on disk. This attribute is optional and as default value, the
    file name will be "smartly" guessed by the function. Use this attribute if the guess is not smart
  enough for you.

- `fields` (string) is the argument given to the main function of your connector by the BaseKonnector.
     It especially contains a `folderPath` which is the string path configured by the user in
     collect/home

- `options` (object) is optional. Possible options :

  + `timeout` (timestamp) can be used if your connector needs to fetch a lot of files and if the
  stack does not give enough time to your connector to fetch it all. It could happen that the
  connector is stopped right in the middle of the download of the file and the file will be
  broken. With the `timeout` option, the `saveFiles` function will check if the timeout has
  passed right after downloading each file and then will be sure to be stopped cleanly if the
  timeout is not too long. And since it is really fast to check that a file has already been
  downloaded, on the next run of the connector, it will be able to download some more
  files, and so on. If you want the timeout to be in 10s, do `Date.now() + 10*1000`.
  You can try it in the previous code.
  + `contentType` (string) ex: 'application/pdf' used to force the contentType of documents when
  they are badly recognized by cozy.
  + `concurrency` (number) default: `1` sets the maximum number of concurrent downloads
  + `fileAttributes` (object) ex: `{created_at: new Date()}` sets some additionnal file
  attributes passed to cozyClient.file.create

**Kind**: Exported function  
**Example**  
```javascript
await saveFiles([{fileurl: 'https://...', filename: 'bill1.pdf'}], fields)
```
<a name="module_signin"></a>

## signin
Provides an handy method to log the user in,
on HTML form pages. On success, it resolves to a promise with a parsed body.

<a name="exp_module_signin--module.exports"></a>

### module.exports() ⏏
Provides an handy method to log the user in,
on HTML form pages. On success, it resolves to a promise with a parsed body.

Errors:

- LOGIN_FAILED if the validate predicate is false
- INVALID_FORM if the element matched by `formSelector` is not a form or has
  no `action` attribute
- UNKNOWN_PARSING_STRATEGY if `parse` is not one of the accepted values:
  `raw`, `cheerio`, `json`.
- VENDOR_DOWN if a request throws a RequestError, or StatusCodeError

It does not submit values provided through `select` tags, except if populated
by user with `formData`.

- `url` is the url to access the html form

- `formSelector` is used by cheerio to uniquely identify the form in which to
  log in

- `formData` is an object `{ name: value, … }`. It is used to populate the
  form, in the proper inputs with the same name as the properties of this
  object, before submitting it. It can also be a function that returns this
  object. The page at `url` would be given as argument, right after having
  been parsed through `cheerio`.

- `parse` allow the user to resolve `signin` with a preparsed body. The
  choice of the strategy for the parsing is one of : `raw`, `json` or
  `cheerio`. `cheerio` being the default.

- `validate` is a predicate taking three arguments `statusCode`, `parsedBody` and `fullResponse`.
  If it is false, `LOGIN_FAILED` is thrown, otherwise the
  signin resolves with `parsedBody` value.

- `requestOpts` allows to pass eventual options to the `signin`'s
  `requestFactory`. It could be useful for pages using `latin1` `encoding`
  for instance.

**Kind**: Exported function  
**Example**  
== basic example : ==
```javascript
const $ = signin({
  url: `http://quotes.toscrape.com/login`,
  formSelector: 'form',
  formData: { username, password }
})
```
If the behavior of the targeted website is not standard. You can pass a validate function which
will allow you to:
 - detect if the credentials work or not -> LOGIN_FAILED
 - detect if actions from the user are needed -> USER_ACTION_NEEDED
 - detect if the targeted website is out -> VENDOR_DOWN
**Example**  
```javascript
const $ = signin({
  url: `http://quotes.toscrape.com/login`,
  formSelector: 'form',
  formData: { username, password },
  validate: (statusCode, $, fullResponse) {
   if (statusCode !== 200) return false // LOGIN_FAILED
   if ($('.cgu').length) throw new Error('USER_ACTION_NEEDED')
   if (fullResponse.request.uri.href.includes('error')) throw new Error('VENDOR_DOWN')
  }
})
```

Do not forget that the use of the signin function is not mandatory in a connector and won't work
if the signin page does not use html forms. Here, a simple POST request may be a lot more
simple.
<a name="module_updateOrCreate"></a>

## updateOrCreate
Creates or updates the given entries according to if they already
exist in the cozy or not

<a name="exp_module_updateOrCreate--module.exports"></a>

### module.exports(entries, doctype, matchingAttributes) ⇒ <code>Promise</code> ⏏
Creates or updates the given entries according to if they already
exist in the cozy or not

You need the full permission for the given doctype in your manifest, to be able to
use this function.

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| entries | <code>Array.&lt;Object&gt;</code> | Documents to save |
| doctype | <code>String</code> | Doctype of the documents |
| matchingAttributes | <code>Array.&lt;String&gt;</code> | attributes in each entry used to check if an entry already exists in the Cozy |

<a name="module_utils"></a>

## utils
Small utilities helping to develop konnectors.


* [utils](#module_utils)
    * [~fetchAll()](#module_utils..fetchAll)
    * [~queryAll()](#module_utils..queryAll)
    * [~findDuplicates()](#module_utils..findDuplicates)
    * [~batchUpdateAttributes()](#module_utils..batchUpdateAttributes)
    * [~batchDelete()](#module_utils..batchDelete)
    * [~getPdfText()](#module_utils..getPdfText)

<a name="module_utils..fetchAll"></a>

### utils~fetchAll()
This function allows to fetch all documents for a given doctype. It is the fastest to get all
documents but without filtering possibilities
deprecated by the findAll method from cozyClient

Parameters:

* `doctype` (string): the doctype from which you want to fetch the data

**Kind**: inner method of [<code>utils</code>](#module_utils)  
<a name="module_utils..queryAll"></a>

### utils~queryAll()
This function allows to fetch all documents for a given doctype exceeding the 100 limit.
It is slower that fetchAll because it fetches the data 100 by 100 but allows to filter the data
with a selector and an index

Parameters:

* `doctype` (string): the doctype from which you want to fetch the data
* `selector` (object): the mango query selector
* `index` (object): (optional) the query selector index. If not defined, the function will
create it's own index with the keys specified in the selector


```javascript
const documents = await queryAll('io.cozy.bills', {vendor: 'Direct Energie'})
```

**Kind**: inner method of [<code>utils</code>](#module_utils)  
<a name="module_utils..findDuplicates"></a>

### utils~findDuplicates()
This function find duplicates in a given doctype, filtered by an optional mango selector

Parameters:

* `doctype` (string): the doctype from which you want to fetch the data
* `selector` (object): (optional) the mango query selector
* `options` :
   - `keys` (array) : List of keys used to check that two items are the same.
   - `index` (optionnal) : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
   - `selector` (optionnal object) : Mango request to get records. Gets all the records by default

Returns an object with the following keys:
* `toKeep`: this is the list of unique documents that you should keep in db
* `toRemove`: this is the list of documents that can remove from db. If this is io.cozy.bills
documents, do not forget to clean linked bank operations

```javascript
const {toKeep, toRemove} = await findDuplicates('io.cozy.bills', {selector: {vendor: 'Direct Energie'}})
```

**Kind**: inner method of [<code>utils</code>](#module_utils)  
<a name="module_utils..batchUpdateAttributes"></a>

### utils~batchUpdateAttributes()
This is a shortcut to update multiple documents in one call

Parameters:

* `doctype` (string): the doctype from which you want to fetch the data
* `ids` (array): array of ids of documents to update
* `transformation` (object): attributes to change with their values
* `options` :
   - `keys` (array) : List of keys used to check that two items are the same.
   - `index` (optionnal) : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
   - `selector` (optionnal object) : Mango request to get records. Gets all the records by default

Returns a promise which resolves with all the return values of updateAttributes

```javascript
await batchUpdateAttributes('io.cozy.bills', [1, 2, 3], {vendor: 'Direct Energie'})
```

**Kind**: inner method of [<code>utils</code>](#module_utils)  
<a name="module_utils..batchDelete"></a>

### utils~batchDelete()
This is a shortcut to delete multiple documents in one call

Parameters:

* `doctype` (string): the doctype from which you want to fetch the data
* `documents` (array): documents to delete with their ids
* `transformation` (object): attributes to change with their values
* `options` :
   - `keys` (array) : List of keys used to check that two items are the same.
   - `index` (optionnal) : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
   - `selector` (optionnal object) : Mango request to get records. Gets all the records by default

Returns a promise which resolves with all the return values of updateAttributes

Example to remove all the documents for a given doctype

```javascript
const documents = await fetchAll('io.cozy.marvel')
await batchDelete('io.cozy.marvel', documents)
```

**Kind**: inner method of [<code>utils</code>](#module_utils)  
<a name="module_utils..getPdfText"></a>

### utils~getPdfText()
This function can read the content of a cozy pdf file and output its text

Parameters:

* `fileId` (string): the id of the file in the cozy
* `options` :
   - `pages` (array or number) : The list of page you want to interpret

Returns a promise which resolves with an object with the following attributes:
   - `text` (string) : The full text of the pdf
   - `1` : The full pdfjs data for page 1
   - `n` : The full pdfjs data for page n

Example:

```javascript
const pdfText = (await getPdfText('887ABCFE87687')).text
```

**Kind**: inner method of [<code>utils</code>](#module_utils)  
<a name="BaseKonnector"></a>

## BaseKonnector
The class from which all the connectors must inherit.
It takes a fetch function in parameter that must return a `Promise`.
You need at least the `GET` permission on `io.cozy.accounts` in your manifest to allow it to
fetch account information for your connector.

**Kind**: global class  

* [BaseKonnector](#BaseKonnector)
    * [new BaseKonnector(fetch)](#new_BaseKonnector_new)
    * [.end()](#BaseKonnector+end)
    * [.fail()](#BaseKonnector+fail)
    * [.init()](#BaseKonnector+init) ⇒ <code>Promise</code>
    * [.saveAccountData(data, options)](#BaseKonnector+saveAccountData) ⇒ <code>Promise</code>
    * [.getAccountData()](#BaseKonnector+getAccountData) ⇒ <code>object</code>
    * [.updateAccountAttributes()](#BaseKonnector+updateAccountAttributes)
    * [.terminate(message)](#BaseKonnector+terminate)

<a name="new_BaseKonnector_new"></a>

### new BaseKonnector(fetch)
Its role is twofold :

- Make the link between account data and konnector
- Handle errors

⚠️  A promise should be returned from the `fetch` function otherwise
the konnector cannot know that asynchronous code has been called.

```
this.terminate('LOGIN_FAILED')
```


| Param | Type | Description |
| --- | --- | --- |
| fetch | <code>function</code> | Function to be run automatically after account data is fetched. This function will be binded to the current connector. If not fetch function is given. The connector will have to handle itself it's own exection and error handling |

**Example**  
```javascript
const { BaseKonnector } = require('cozy-konnector-libs')

module.exports = new BaseKonnector(function fetch () {
 // use this to access the instance of the konnector to
 // store any information that needs to be passed to
 // different stages of the konnector
 return request('http://ameli.fr')
   .then(computeReimbursements)
   .then(saveBills)
})
```
<a name="BaseKonnector+end"></a>

### baseKonnector.end()
Hook called when the connector is ended

**Kind**: instance method of [<code>BaseKonnector</code>](#BaseKonnector)  
<a name="BaseKonnector+fail"></a>

### baseKonnector.fail()
Hook called when the connector fails

**Kind**: instance method of [<code>BaseKonnector</code>](#BaseKonnector)  
<a name="BaseKonnector+init"></a>

### baseKonnector.init() ⇒ <code>Promise</code>
Initializes the current connector with data coming from the associated account

**Kind**: instance method of [<code>BaseKonnector</code>](#BaseKonnector)  
**Returns**: <code>Promise</code> - with the fields as an object  
<a name="BaseKonnector+saveAccountData"></a>

### baseKonnector.saveAccountData(data, options) ⇒ <code>Promise</code>
Saves data to the account that is passed to the konnector.
Use it to persist data that needs to be passed to each
konnector run.

By default, the data is merged to the remote data, use
`options.merge = false` to overwrite the data.

The data is saved under the `.data` attribute of the cozy
account.

**Kind**: instance method of [<code>BaseKonnector</code>](#BaseKonnector)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | Attributes to be merged |
| options | <code>object</code> | { merge: true|false } |

<a name="BaseKonnector+getAccountData"></a>

### baseKonnector.getAccountData() ⇒ <code>object</code>
Get the data saved by saveAccountData

**Kind**: instance method of [<code>BaseKonnector</code>](#BaseKonnector)  
<a name="BaseKonnector+updateAccountAttributes"></a>

### baseKonnector.updateAccountAttributes()
Update account attributes and cache the account

**Kind**: instance method of [<code>BaseKonnector</code>](#BaseKonnector)  
<a name="BaseKonnector+terminate"></a>

### baseKonnector.terminate(message)
Send a special error code which is interpreted by the cozy stack to terminate the execution of the
connector now

**Kind**: instance method of [<code>BaseKonnector</code>](#BaseKonnector)  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The error code to be saved as connector result see [docs/ERROR_CODES.md] |

<a name="Document"></a>

## Document
Simple Model for Documents. Allows to specify
`shouldSave`, `shouldUpdate` as methods.

Has useful `isEqual` method

**Kind**: global class  
<a name="Document+isEqual"></a>

### document.isEqual()
Compares to another document deeply.

`_id` and `_rev` are by default ignored in the comparison.

By default, will compare dates loosely since you often
compare existing documents (dates in ISO string) with documents
that just have been scraped where dates are `Date`s.

**Kind**: instance method of [<code>Document</code>](#Document)  
<a name="LOGIN_FAILED"></a>

## LOGIN_FAILED : <code>String</code>
The konnector could not login

**Kind**: global constant  
<a name="NOT_EXISTING_DIRECTORY"></a>

## NOT_EXISTING_DIRECTORY : <code>String</code>
The folder specified as folder_to_save does not exist (checked by BaseKonnector)

**Kind**: global constant  
<a name="VENDOR_DOWN"></a>

## VENDOR_DOWN : <code>String</code>
The vendor's website is down

**Kind**: global constant  
<a name="USER_ACTION_NEEDED"></a>

## USER_ACTION_NEEDED : <code>String</code>
There was an unexpected error, please take a look at the logs to know what happened

**Kind**: global constant  
<a name="FILE_DOWNLOAD_FAILED"></a>

## FILE_DOWNLOAD_FAILED : <code>String</code>
There was a problem while downloading a file

**Kind**: global constant  
<a name="SAVE_FILE_FAILED"></a>

## SAVE_FILE_FAILED : <code>String</code>
There was a problem while saving a file

**Kind**: global constant  
<a name="DISK_QUOTA_EXCEEDED"></a>

## DISK_QUOTA_EXCEEDED : <code>String</code>
Could not save a file to the cozy because of disk quota exceeded

**Kind**: global constant  
<a name="CHALLENGE_ASKED"></a>

## CHALLENGE_ASKED : <code>String</code>
It seems that the website requires a second authentification factor that we don’t support yet.

**Kind**: global constant  
<a name="LOGIN_FAILED_TOO_MANY_ATTEMPTS"></a>

## LOGIN_FAILED_TOO_MANY_ATTEMPTS : <code>String</code>
Temporarily blocked

**Kind**: global constant  
<a name="USER_ACTION_NEEDED_OAUTH_OUTDATED"></a>

## USER_ACTION_NEEDED_OAUTH_OUTDATED : <code>String</code>
Access refresh required

**Kind**: global constant  
<a name="USER_ACTION_NEEDED_ACCOUNT_REMOVED"></a>

## USER_ACTION_NEEDED_ACCOUNT_REMOVED : <code>String</code>
Unavailable account

**Kind**: global constant  
<a name="USER_ACTION_NEEDED_CHANGE_PASSWORD"></a>

## USER_ACTION_NEEDED_CHANGE_PASSWORD : <code>String</code>
Unavailable account

**Kind**: global constant  
<a name="USER_ACTION_NEEDED_PERMISSIONS_CHANGED"></a>

## USER_ACTION_NEEDED_PERMISSIONS_CHANGED : <code>String</code>
Password update required

**Kind**: global constant  
<a name="USER_ACTION_NEEDED_CGU_FORM"></a>

## USER_ACTION_NEEDED_CGU_FORM : <code>String</code>
The user needs to accept a CGU form before accessing the rest of the website

**Kind**: global constant  
<a name="mkSpec"></a>

## mkSpec()
Declarative scraping.

Describe your items attributes and where to find/parse them
instead of imperatively building them.

Heavily inspired by [artoo] scraping method.

[artoo]: https://medialab.github.io/artoo/

**Kind**: global function  
<a name="scrape"></a>

## scrape($, spec(s), [childSelector]) ⇒ <code>object</code> \| <code>array</code>
Scrape a cheerio object for properties

**Kind**: global function  
**Returns**: <code>object</code> \| <code>array</code> - - Item(s) scraped  

| Param | Type | Description |
| --- | --- | --- |
| $ | <code>cheerio</code> | Cheerio node which will be scraped |
| spec(s) | <code>object</code> \| <code>string</code> | Options object describing what you want to scrape |
| [childSelector] | <code>string</code> | If passed, scrape will return an array of items |

**Example**  
`scrape` can be used to declaratively extract data :

- For one object :

```
const item = scrape($('#item'), {
  title: '.title',
  content: '.content'
})
```

- For a list of objects :

```
const items = scrape($('#content'), {
  title: '.title',
  content: '.content'
}, '.item')
```

For more power, you can use `object`s for each retriever :

```
const items = scrape($('#content'), {
  title: '.title',
  content: '.content',
  link: {
    sel: 'a',
    attr: 'href'
  },
}, '.item')
```

Here the `href` attribute of the `a` inside `.item`s would have been
put into the `link` attribute of the items returned by `scrape`.

Available options :

- `sel`: the CSS selector used to target the HTML node from which data will be scraped
- `attr`: the HTML attribute from which to extract data
- `parse`: function applied to the value extracted (`{ sel: '.price', parse: parseAmount }`)
- `fn`: if you need something more complicated than `attr`, you can use this function, it receives
the complete DOM node. `{ sel: '.person', fn: $node => $node.attr('data-name') + $node.attr('data-firstname') }`


### ⚠ Permissions

Please note that some classes require some permissions:

- `io.cozy.accounts` for the `BaseKonnector` class (`GET` only)
- `io.cozy.files` to save files
- `io.cozy.bills` to save bills
- `io.cozy.bank.operations` for `linkBankOperations`
