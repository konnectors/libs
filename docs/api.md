## API

## Modules

<dl>
<dt><a href="#module_addData">addData</a></dt>
<dd><p>Creates the records in the given doctype.</p>
</dd>
<dt><a href="#module_cozy-client">cozyClient</a></dt>
<dd><p>This is a <a href="https://cozy.github.io/cozy-client-js/">cozy-client-js</a> instance already initialized and ready to use</p>
</dd>
<dt><a href="#module_filterData">filterData</a></dt>
<dd><p>Used not to duplicate data.</p>
<ul>
<li><code>options</code> :<ul>
<li><code>keys</code> : List of keys used to check that two items are the same. By default it is set to `[&#39;id&#39;]&#39;.</li>
<li><code>index</code> : Return value returned by <code>cozy.data.defineIndex</code>, the default will correspond to all documents of the selected doctype.</li>
<li><code>selector</code> : Mango request to get records. Default is built from the keys <code>{selector: {_id: {&quot;$gt&quot;: null}}}</code> to get all the records.</li>
</ul>
</li>
</ul>
</dd>
<dt><a href="#module_linkBankOperations">linkBankOperations</a></dt>
<dd><h3 id="linkbankoperations-entries-doctype-fields-options-">linkBankOperations ( entries, doctype, fields, options = {} )</h3>
<p>This function will soon move to a dedicated service. You should not use it.
The goal of this function is to find links between bills and bank operations.</p>
</dd>
<dt><a href="#module_request">request</a></dt>
<dd><p>This is a function which returns an instance of
<a href="https://www.npmjs.com/package/request-promise">request-promise</a> initialized with
defaults often used in connector development.</p>
<pre><code class="language-javascript">// Showing defaults
req = request({
  cheerio: false,
  jar: true,
  json: true
})
</code></pre>
<ul>
<li><code>cheerio</code>  will parse automatically the <code>response.body</code> in a cheerio instance</li>
</ul>
<pre><code class="lang-js">req = request({ cheerio: true })
req(&#39;http://github.com&#39;, $ =&gt; {
  const repos = $(&#39;#repo_listing .repo&#39;)
})
</code></pre>
<ul>
<li><code>jar</code> is passed to <code>request</code> options. Remembers cookies for future use.</li>
<li><code>json</code> will parse the <code>response.body</code> as JSON</li>
</ul>
</dd>
<dt><a href="#module_saveBills">saveBills</a></dt>
<dd><p>Combines the features of <code>saveFiles</code>, <code>hydrateAndFilter</code>, <code>addData</code> and  <code>linkBankOperations</code>.
Will create <code>io.cozy.bills</code> objects. The default deduplication keys are
<code>[&#39;date&#39;, &#39;amount&#39;, &#39;vendor&#39;]</code>.</p>
<p><code>options</code> is passed directly to <code>saveFiles</code>, <code>hydrateAndFilter</code>, <code>addData</code> and <code>linkBankOperations</code>.</p>
</dd>
<dt><a href="#module_saveFiles">saveFiles</a></dt>
<dd><p>The goal of this function is to save the given files in the given folder via the Cozy API.</p>
<ul>
<li><p><code>files</code> is an array of <code>{ fileurl, filename }</code> :</p>
<ul>
<li>fileurl: The url of the file. This attribute is mandatory or
this item will be ignored</li>
<li>filename : The file name of the item written on disk. This attribute is optional and as default value, the
file name will be &quot;smartly&quot; guessed by the function. Use this attribute if the guess is not smart
enough for you.</li>
</ul>
</li>
<li><p><code>folderPath</code> (string) is relative to the main path given by the <code>cozy-collect</code> application to the connector. If the connector is run
in standalone mode, the main path is the path of the connector.</p>
</li>
<li><p><code>options</code> (object) is optional. Possible options :</p>
<ul>
<li><code>timeout</code> (timestamp) can be used if your connector
needs to fetch a lot of files and if the the stack does not give enough time to your connector to
fetch it all. It could happen that the connector is stopped right in the middle of the download of
the file and the file will be broken. With the <code>timeout</code> option, the <code>saveFiles</code> function will check
if the timeout has passed right after downloading each file and then will be sure to be stopped
cleanly if the timeout is not too long. And since it is really fast to check that a file has
already been downloaded, on the next run of the connector, it will be able to download some more
files, and so on. If you want the timeout to be in 10s, do <code>Date.now() + 10*1000</code>. You can try it in the previous code.</li>
</ul>
</li>
</ul>
</dd>
<dt><a href="#module_updateOrCreate">updateOrCreate</a></dt>
<dd><p>The goal of this function is create or update the given entries according to if they already
exist in the cozy or not</p>
<ul>
<li><p><code>entries</code> is an array of objects with any attributes :</p>
</li>
<li><p><code>doctype</code> (string) is the cozy doctype where the entries should be saved</p>
</li>
<li><p><code>filters</code> (array) is the list of attributes in each entry should be used to check if an entry
is already saved in the cozy</p>
</li>
</ul>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#baseKonnector">baseKonnector</a></dt>
<dd><p>The class from which all the connectors must inherit.
It takes a fetch function in parameter that must return a <code>Promise</code>.</p>
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
</dl>

## Functions

<dl>
<dt><a href="#log">log(type, message, label, namespace)</a></dt>
<dd><p>Use it to log messages in your konnector. Typical types are</p>
<ul>
<li><code>debug</code></li>
<li><code>warning</code></li>
<li><code>info</code></li>
<li><code>error</code></li>
<li><code>ok</code></li>
</ul>
</dd>
</dl>

<a name="module_addData"></a>

## addData
Creates the records in the given doctype.

<a name="module_cozy-client"></a>

## cozyClient
This is a [cozy-client-js](https://cozy.github.io/cozy-client-js/) instance already initialized and ready to use

<a name="module_filterData"></a>

## filterData
Used not to duplicate data.

* `options` :
   - `keys` : List of keys used to check that two items are the same. By default it is set to `['id']'.
   - `index` : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
   - `selector` : Mango request to get records. Default is built from the keys `{selector: {_id: {"$gt": null}}}` to get all the records.

<a name="module_linkBankOperations"></a>

## linkBankOperations
### linkBankOperations ( entries, doctype, fields, options = {} )

This function will soon move to a dedicated service. You should not use it.
The goal of this function is to find links between bills and bank operations.

<a name="module_request"></a>

## request
This is a function which returns an instance of
[request-promise](https://www.npmjs.com/package/request-promise) initialized with
defaults often used in connector development.

```js
// Showing defaults
req = request({
  cheerio: false,
  jar: true,
  json: true
})
```

- `cheerio`  will parse automatically the `response.body` in a cheerio instance

```js
req = request({ cheerio: true })
req('http://github.com', $ => {
  const repos = $('#repo_listing .repo')
})
```

- `jar` is passed to `request` options. Remembers cookies for future use.
- `json` will parse the `response.body` as JSON

<a name="module_saveBills"></a>

## saveBills
Combines the features of `saveFiles`, `hydrateAndFilter`, `addData` and  `linkBankOperations`.
Will create `io.cozy.bills` objects. The default deduplication keys are
`['date', 'amount', 'vendor']`.

`options` is passed directly to `saveFiles`, `hydrateAndFilter`, `addData` and `linkBankOperations`.

<a name="module_saveFiles"></a>

## saveFiles
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

<a name="module_updateOrCreate"></a>

## updateOrCreate
The goal of this function is create or update the given entries according to if they already
exist in the cozy or not

- `entries` is an array of objects with any attributes :

- `doctype` (string) is the cozy doctype where the entries should be saved

- `filters` (array) is the list of attributes in each entry should be used to check if an entry
  is already saved in the cozy

<a name="baseKonnector"></a>

## baseKonnector
The class from which all the connectors must inherit.
It takes a fetch function in parameter that must return a `Promise`.

**Kind**: global class  

* [baseKonnector](#baseKonnector)
    * [new baseKonnector(fetch)](#new_baseKonnector_new)
    * [.end()](#baseKonnector+end)
    * [.fail()](#baseKonnector+fail)
    * [.init()](#baseKonnector+init) ⇒ <code>Promise</code>
    * [.saveAccountData(data, options)](#baseKonnector+saveAccountData) ⇒ <code>Promise</code>
    * [.terminate(message)](#baseKonnector+terminate)

<a name="new_baseKonnector_new"></a>

### new baseKonnector(fetch)
Its role is twofold :

- Make the link between account data and konnector
- Handle errors

```
this.terminate('LOGIN_FAILED')
```


| Param | Type | Description |
| --- | --- | --- |
| fetch | <code>function</code> | Function to be run automatically after account data is fetched. This function will be binded to the current connector. If not fetch function is given. The connector will have to handle itself it's own exection and error handling |

**Example**  
```
const { BaseKonnector } = require('cozy-konnector-libs')

module.exports = new BaseKonnector(function fetch () {
 // use this to access the instance of the konnector to
 // store any information that needs to be passed to
 // different stages of the konnector
})
```
<a name="baseKonnector+end"></a>

### baseKonnector.end()
Hook called when the connector is ended

**Kind**: instance method of [<code>baseKonnector</code>](#baseKonnector)  
<a name="baseKonnector+fail"></a>

### baseKonnector.fail()
Hook called when the connector fails

**Kind**: instance method of [<code>baseKonnector</code>](#baseKonnector)  
<a name="baseKonnector+init"></a>

### baseKonnector.init() ⇒ <code>Promise</code>
Initializes the current connector with data comming from the associated account

**Kind**: instance method of [<code>baseKonnector</code>](#baseKonnector)  
**Returns**: <code>Promise</code> - with the fields as an object  
<a name="baseKonnector+saveAccountData"></a>

### baseKonnector.saveAccountData(data, options) ⇒ <code>Promise</code>
Saves data to the account that is passed to the konnector.
Use it to persist data that needs to be passed to each
konnector run.

By default, the data is merged to the remote data, use
`options.merge = false` to overwrite the data.

The data is saved under the `.data` attribute of the cozy
account.

**Kind**: instance method of [<code>baseKonnector</code>](#baseKonnector)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | Attributes to be merged |
| options | <code>object</code> | { merge: true|false } |

<a name="baseKonnector+terminate"></a>

### baseKonnector.terminate(message)
Send a special error code which is interpreted by the cozy stack to terminate the execution of the
connector now

**Kind**: instance method of [<code>baseKonnector</code>](#baseKonnector)  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | The error code to be saved as connector result see [docs/ERROR_CODES.md] |

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
<a name="log"></a>

## log(type, message, label, namespace)
Use it to log messages in your konnector. Typical types are

- `debug`
- `warning`
- `info`
- `error`
- `ok`

**Kind**: global function  

| Param | Type |
| --- | --- |
| type | <code>string</code> | 
| message | <code>string</code> | 
| label | <code>string</code> | 
| namespace | <code>string</code> | 

**Example**  
They will be colored in development mode. In production mode, those logs are formatted in JSON to be interpreted by the stack and possibly sent to the client. `error` will stop the konnector.

```js
logger = log('my-namespace')
logger('debug', '365 bills')
// my-namespace : debug : 365 bills
logger('info', 'Page fetched')
// my-namespace : info : Page fetched
```


### ⚠ Permissions

Please note that some classes require some permissions:

- `io.cozy.accounts` for the `BaseKonnector` class (`GET` only)
- `io.cozy.files` to save files
- `io.cozy.bills` to save bills
- `io.cozy.bank.operations` for `linkBankOperations`
