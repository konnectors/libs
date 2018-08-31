# Table of contents
- [Konnector synchronisation data and options](#konnector-synchronisation-data-and-options)
  * [Problems](#problems)
  * [Current usage](#current-usage)
  * [Objectives of this document](#objectives-of-this-document)
  * [Storing synchronization data in documents](#storing-synchronization-data-in-documents)
    + [Simple case, by id](#simple-case--by-id)
    + [By multiple attributes](#by-multiple-attributes)
    + [By custom method](#by-custom-method)
  * [Saving document based on synchronization strategy](#saving-document-based-on-synchronization-strategy)
    + [Adding synchronization data](#adding-synchronization-data)
    + [Filtering entries](#filtering-entries)
  * [Synchronization strategy](#synchronization-strategy)
    + [findLegacyDocument](#findlegacydocument)
    + [getSyncData](#getsyncdata)
      - [Array](#array)
        * [Example](#example)
      - [function](#function)
        * [Example](#example-1)
    + [konnector](#konnector)
    + [shouldSave](#shouldsave)
    + [shouldUpdate](#shouldupdate)
  * [Whole example](#whole-example)

# Konnector synchronisation data and options

## Problems

Except bank konnectors which are already solving the addressed problem, all konnectors are currently processing data they are collecting in the same way:

* Get all data to synchronize
* Store it in CouchDB, even if it means overriding previously synchronized data.

This process has at least two major flows :
* We are always synchronizing _all_ the data provided by the external service.
* When something is modified (for example, the name of the stored file, it's almost sure that the previous one will be kept and that we'll have a duplicate)

Another side effect could be that in a very large set of documents to synchronize, the whole process may take more than 3 minutes and never synchronize documents at the end of the list.

## Current usage

When saving bills, `cozy-konnector-libs` provides a filtering and hydratation mechanism, to avoid overriding existing bills. It is done in function [`hydrateAndFilters`](https://github.com/cozy/cozy-konnector-libs/blob/master/libs/hydrateAndFilter.js).

This method performs two actions :
* hydrate entries retrieved from service with usable data from couchDB (like existing bill id)
* filter entries retrieved from service and return only entries that need to be saved/synchronized.

## Objectives of this document

The goals of this document are:

* Define a common way to store synchronization data for all konnector
* Propose a naive implementation for an abstract synchronisation data storing mechanism, provided by `cozy-konnector-libs`
* Propose a solution to synchronize every type of data or file, not only bills
* Taking the `hydrateAndFilter` function as basis, split it in three functions performing the following tasks : actual filtering, synchronization data hydratation and saving/updating current database document with correspondig external entries (the part done by the actual _hydratation_)

## Storing synchronization data in documents

Before saving any data or file, we will add in the relying document every synchronization data we will need. The added data will depend on how the service the konnector connects to retrieve entries and which information they gave us.

### Simple case, by id

We suppose that in the most cases, we will face to entries provinding their own `id` attribute. The idea is to store it as synchronization data to be able to easily retrieve them later.
To store synchronization data, we are using a `sync` attribute in document `metadata` attribute. Example:

```json
{
  "metadata": {
    "sync": {
      "id": "7ee401e841c94159addb47f190903139",
      "konnector": "trainline",
      "last_sync": "Mon, 12 Feb 2018 16:25:34 GMT"
    }
  }
}
```
The expected information to be save is:

| field | role |
|-------|------|
| id        | The id of the document, but given by the external service. If the external service does not provide any id or uuid, it could be interesting to generate one, with an hash of the file for example.
| konnector | The slug of the konnector (Example: `trainline`, `freemobile`, `cic`). This could be very useful to retrieve data synchronized with this konnector.
| last_sync | Date of last synchronization, set to `now()` when storage is made.


### By multiple attributes

If the external service does not provide any `id` attribute, we may need to use instead a list of attributes, for example `firstname`, `lastname`, `dateofbirth`.

```json
{
  "metadata": {
    "sync": {
      "firstname": "Claude",
      "lastname": "Causi",
      "dateofbirth": "06/12/1980"
    }
  }
}
```

As we cannot be sure that we will have different data, it could be better to use a custom way of providing an unique identifier.

### By custom method

When the external service does not provide any identifier, we have to use a custom method to generate one.
It could be for example the filename or a hash generated with the document content.

```json
{
  "metadata": {
    "sync": {
      "id:": "customhash34FED5465645ABF54656FCB"
    }
  }
}
```

## Saving document based on synchronization strategy

To solve the synchronization process weed need to:
* be able to add synchronization data on any type of document
* be able to compare external entries to current database state
* provide a default implementation while letting the contributors to define their own ones

### Adding synchronization data

We should provide an `addSyncData` function could, which look like this (naive implementation, this piece of code needs to be improved to handle cases where `synchronizationStrategy.idAttribute` is an array or a function):

```js
const addSyncData = (document, entry, synchronizationStrategy) => {
  return {
    ...document,
    metadata: {
      ...document.metadata,
      id: entry[synchronizationStrategy.idAttribute]
    }
}
````

Where `document` is the future document to save, `entry` the corresponding external entry, and `synchronizationStrategy` and object defining the synchronization properties and methods (see below).

### Filtering entries

Now we have saved our documents in database with consistent synchronization metadata, we need to provide a way to filter external entries.

We should provide a `filterEntriesToSynchronize` which returns a list of entries with new data or data to update.

As `addSyncData`, this method will receive a `synchronizationStrategy`. The filtering algorithm should be based on the returned value of `synchronizationStrategy.shouldSave` and `synchronizationStrategy.shouldUpdate`.

> ⚠️ As the `synchronizationStrategy.shouldSave` and `synchronizationStrategy.shouldUpdate` will be asynchronous methods, `filterEntriesToSynchronize` should also be asynchronous.

A naive example of `filterEntriesToSynchronize` implementation should be:

```js
const filterEntriesToSynchronize = async (cozy, entries, synchronizationStrategy) = {
  const filtered = []

  entries.forEach(entry => {
    // getExistingSynchronizedDocument needs to be implemented, it should retrieve
    // existing document from database, based on synchronization data.
    const existingDocument = cozy.getExistingSynchronizedDocument(entry, synchronizationStrategy)
  
    const toSave = await synchronizationStrategy.shouldSave(entry, existingDocument)
    const toUpdate = await synchronizationStrategy.shouldUpdate(entry, existingDocument)

    if (toSave || toUpdate) filtered.push(entry)
  })

  return filtered
}
```

## Synchronization strategy

For our functions or methods dealing with synchronization, we pass a `synchronizationStrategy` object. Internally, we will use a default one but let the ability to contributors to pass their own ones.

It is a simple object containing the following properties:

| Option | Role |
|--------|---------|
| disableSyncData | (boolean) Disable storage of  synchronization data. Default: `false` |
| findLegacyDocument | (function) Custom function which a konnector may use to look for a legacy document. Default is `null`. See below for more details.
| getSyncData | (function) A mapping method returning additional synchronization data which have to be added to the document. |
| idAttribute | (string&#124;Array&#124;function) How the identifier attribute is named in the entry. Default value: `id`. See below for additional customization |
| konnector | *Mandatory* (string) The slug (or better, an uuid) of the current konnector.|
| shouldSave | (function) A method taking current entry and matching document in database to evaluate if an entry has to be saved in database. See below default method and customization.|
| shouldUpdate | (function) A method taking current entry and matching document in database to evaluate if a document must be updated with current entry. See below for default method and customization. |

### findLegacyDocument
If a document has not been saved yet with actual synchronization data, we will have no way to retrieve it, except by providing a `findLegacyDocument` function to `saveEntry` options. This signature of a `findLegacyDocument` function is:

```js
async function (entry, cozy) => { /* look for your document */ }
````

The `cozy` parameter is an instance of Cozy-Client.

The idea is for example to retrive a document by its file path or any other accurate information.

### getSyncData
This method returns any addtional synchronization data the konnector should need. Default method should be something returning an empty object or `null`.

```js
(entry) => ({})
```

A konnector should provide its own method:

```js
{
  getSyncData: (entry) => ({
    filename: entry.name
  })
}```

### idAttribute
#### String
Name of the id attribute in entry. Default is `id`. If we want to use another name, we may use:
```js
saveFiles(files, {idAttribute: 'uuid'})
```
#### Array
This attribute may also be an array of string, defining each entry attribute which must be used for identifier.

##### Example
```js
saveFiles(files, {idAttribute: ['name', 'author', 'date']})
```

In this case, all fields are used in synchronization data.


#### function

When an entry does not provide an unique identifer, it is possible to use a function as `idAttribute` to customize the way the unique identifer is generated.

##### Example
```js
addData(file, {idAttribute: (entry) => hash(entry)})
// hash() is a custom method  hashing the current file.
```

### konnector

The konnector attribute is used as a key reference to retrieve all document synchronized by this konnector.

For now, the `konnector` option will be needed for every call. But it could be interesting to initialize some kind of runner with it, which may encapsulate all the `cozy-konnector-libs` functions.

### shouldSave

The shouldSave function returns a boolean which indicate if the entry should be saved. The default method should be:
```js
async function shouldSave (entry, existingDocument, cozy) => {
  return Promise.resolve(!existingDocument)
}
```
When calling this function, it is assumed that `cozy-konnector-libs` first queries the database for an exisring document, based on synchronization data and pass the document resulting the query to the `shouldSave` function, event if this document is `null`. We pass the whole document, and not only synchronization data, to let the contributors free on their way they are determining it a document should be saved.

As a third parameter, a cozyClient instance is passed, it may be used by a konnector to perform another query.

Because of this third parameter, the whole `shouldSave` method is asynchronous.

### shouldUpdate

The `shouldUpdate` function acts exactly like `shouldSave`, except that it is used to determine if a document should be updated. By default, we make the choice to never update a document (except if it does not have synchronization data, see `findLegacyDocument` above). But some konnectors like `Linxo` related ones need to update existing documents.

The default method is:
```js
async function shouldUpdate (entry, existingDocument, cozy) {
  // Update an existing document only if it does not have synchronization data
  const hasSyncData = !!existingDocument && !!existingDocument.metadata && !! existingDocument.metadata.sync
  return Promise.resolve(!hasSyncData)
}
````

## Whole example

As the way data are saved from `cozy-konnector-libs` differs based on data type, we let the saving mechanism to others functions or methods. For example, in existing codebase, bills are saved in a specific way, resulting in two documents in database. However, we could provide top-level functions or methods, like `synchronizeBills` or a more generic `synchronizeData`.

Here is a whole and naive example of how `synchronizeBills` could be implemebted:

```js
const synchronizeBills = async (cozy, entries, synchronizationStrategy) => {
  return await filteredEntries = await filterEntriesToSynchronize(cozy, entries, synchronizationStrategy)
    .then(filteredEntries => filteredEntries.map(entry => addSyncData(entry, synchronizationStrategy)))
    // existing saveBills method (with maybe some little changes)
    .saveBills(synchronizedDocuments)
}
```

Usage could be:

```jse
synchronizeBills(cozy, entries, {
  findLegacyDocument: (entry, cozy) => {
    return cozy.files.statByPath(getEntryPath(entry))
  },
  getSyncData: (file) => ({
    fileName: file.name
  }),
  idAttribute: 'uuid',
  konnector: 'myservice',
  shouldSave: (file) => {
    // For whatever reason we only save files created after 2010
    return Promise.resolve(moment(file.creationDate).year().isAfter(2010))
  },
  shouldUpdate: (file, existingDocument) => {
    const hasBeenModified = moment(file.modificationDate).isAfter(existingDocument.metadata.sync.last_sync)
    return Promise.resolve(hasBeenModified)
  }
})
```
Every synchronized document will contain:
```json
{
  "metadata": {
    "sync": {
      "konnector": "myservice",
      "id": "<entry_id>",
      "last_sync": "<now>",
      "fileName": "<fileName>"
    }
  }
}
```
