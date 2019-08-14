const fs = require('fs')
const stub = require('./cozy-client-js-stub')
fs.unlinkSync('importedData.json')

const low = require('lowdb')
const lodashId = require('lodash-id')
const Memory = require('lowdb/adapters/Memory')
const omit = require('lodash/omit')

describe('cozy-client-js-stub', () => {
  const db = low(new Memory())
  db._.mixin(lodashId)
  db._.id = '_id'
  stub._setDb(db)
  beforeEach(() => {
    db.setState({})
  })

  it('should create a doc in a given doctype', async () => {
    await stub.data.create('io.cozy.bills', { toto: 'test' })
    expect(
      db
        .get('io.cozy.bills')
        .first()
        .omit('_id')
        .value()
    ).toEqual({ toto: 'test' })
  })
  it('should update attributes of a given document', async () => {
    db.defaults({ 'io.cozy.bills': [] }).write()
    const doc = db
      .get('io.cozy.bills')
      .insert({ test: 'toto' })
      .write()
    await stub.data.updateAttributes('io.cozy.bills', doc._id, {
      test: 'updated',
      newattr: 'value'
    })
    expect(
      db
        .get('io.cozy.bills')
        .first()
        .omit('_id')
        .value()
    ).toEqual({ test: 'updated', newattr: 'value' })
  })
  it('should query documents with given attributes', async () => {
    db.defaults({ 'io.cozy.bills': [] }).write()
    const bills = db.get('io.cozy.bills')
    bills.insert({ mandatory: 'toto' }).write()
    bills.insert({ otherattr: 'toto' }).write()
    bills.insert({ mandatory: 'titi' }).write()
    const index = await stub.data.defineIndex('io.cozy.bills')
    const result = await stub.data.query(index, {
      selector: {
        mandatory: 'toto'
      }
    })
    expect(result.map(doc => omit(doc, '_id'))).toEqual([{ mandatory: 'toto' }])
  })
  it('should get all element of a doctype', async () => {
    db.defaults({ 'io.cozy.bills': [] }).write()
    const bills = db.get('io.cozy.bills')
    bills.insert({ mandatory: 'toto' }).write()
    bills.insert({ otherattr: 'toto' }).write()
    bills.insert({ mandatory: 'titi' }).write()
    const result = await stub.data.findAll('io.cozy.bills')
    expect(result.map(doc => omit(doc, '_id'))).toEqual([
      { mandatory: 'toto' },
      { otherattr: 'toto' },
      { mandatory: 'titi' }
    ])
  })
  it('should remove an element from a doctype', async () => {
    db.defaults({ 'io.cozy.bills': [] }).write()
    const bills = db.get('io.cozy.bills')
    bills.insert({ mandatory: 'toto' }).write()
    bills.insert({ otherattr: 'toto' }).write()
    const doc = bills.insert({ mandatory: 'titi' }).write()
    await stub.data.delete('io.cozy.bills', doc)
    const result = bills.value().map(doc => omit(doc, '_id'))
    expect(result).toEqual([{ mandatory: 'toto' }, { otherattr: 'toto' }])
  })
  it('should find a doc in a doctype with its id', async () => {
    db.defaults({ 'io.cozy.bills': [] }).write()
    const bills = db.get('io.cozy.bills')
    const doc = bills.insert({ mandatory: 'toto' }).write()
    bills.insert({ otherattr: 'toto' }).write()
    bills.insert({ mandatory: 'titi' }).write()
    const result = await stub.data.find('io.cozy.bills', doc._id)
    expect(omit(result, '_id')).toEqual({ mandatory: 'toto' })
  })
})
