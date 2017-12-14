# Migrating from v2 to v3

Oviously, start by upgrading the `cozy-konnector-libs` package.

```bash
$> yarn upgrade cozy-konnector-libs --save
```

## Deprecated attributes
Following konnector's attributes may be removed, as they are not used anymore:
* `color`
* `name`
* `models`
* `category`
* `dataType`
* `customView`

## Removed models
The following models has been removed and code using them has to be adapted:
* Bill

## Removed methods
The following methods has been removed from codebase:
* `filterExisting`
* `linkBankOperation`
* `saveFiles`
* `filterData`
* `addDataandlinkBankOperation`
These ones have been directly encapsulated into `saveBills`

## Konnector instanciation
To instanciate a konnector, juste instanciate a new `BaseKonnector` with a `fetch` method as parameter. Replace every previous `baseKonnector.createNew()` call.

The `fetch` method should take `fields` as parameter.

The `fields` parameter contains all data related to the konnector, like login/password or the folder information where the data fetchd by the konnector will be stored.

## Goobye callbacks, hello promises
The callback mechanism has been replaced by the use of promise. So All `next` parameter can be replaced by promises.

### No more `request`, now use `request`
The `request` method is now provided directly by `cozy-konnector-libs`, so the following import
```js
const request = require('request')
```
have to be replaced by
```js
const { request } = require('cozy-konnector-libs')
```
`request` is a function returning an instance of [`request-promise`](https://github.com/request/request-promise) with a custom configuration (`followAllRedirects` is set to `true`).
