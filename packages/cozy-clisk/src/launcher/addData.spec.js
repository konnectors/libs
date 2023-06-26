import addData from './addData'

describe('addData', function () {
  it('should save data and add sourceAccountIdentifier', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: {
          ...doc,
          _id: 'testid',
          _rev: 'testrev'
        }
      }))
    }
    const bills = [{ amount: 12 }]
    const result = await addData(bills, 'io.cozy.bills', {
      client,
      sourceAccountIdentifier: 'test@login'
    })
    expect(client.save).toHaveBeenCalledWith({
      amount: 12,
      sourceAccountIdentifier: 'test@login',
      _type: 'io.cozy.bills'
    })
    expect(result).toStrictEqual([
      {
        amount: 12,
        sourceAccountIdentifier: 'test@login',
        _type: 'io.cozy.bills',
        _id: 'testid',
        _rev: 'testrev'
      }
    ])
  })
})
