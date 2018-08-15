const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
const Reservation = require(path.join('..', 'db', 'models', 'reservation'))
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server

describe('reservation', async function () {
  describe('get', async function () {
    before('adding reservation to db', async function () {
      await new Reservation(mocks.RESERVATION1).save()
      await new Reservation(mocks.RESERVATION2).save()
      await new Reservation(mocks.RESERVATION3).save()
    })

    it('should get a list of all reservations if no parameters are given', async function () {
      const response = await server.inject({
        method: 'GET',
        url: `/reservation`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(3)
      expectToContain(response.result, mocks.RESERVATION1)
      expectToContain(response.result, mocks.RESERVATION2)
      expectToContain(response.result, mocks.RESERVATION3)
    })

    it('should give a list of reservations when one parameter is given', async function () {
      // companyId
      let response = await server.inject({
        method: 'GET',
        url: `/reservation?companyId=${mocks.RESERVATION1.companyId}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(2)
      expectToContain(response.result, mocks.RESERVATION1)
      expectToContain(response.result, mocks.RESERVATION2)

      // edition
      response = await server.inject({
        method: 'GET',
        url: `/reservation?edition=${mocks.RESERVATION1.edition}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(2)
      expectToContain(response.result, mocks.RESERVATION1)
      expectToContain(response.result, mocks.RESERVATION3)
    })

    it('should give a list of reservations when all parameters are given', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/reservation?companyId=${mocks.RESERVATION3.companyId}&edition=${mocks.RESERVATION3.edition}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, mocks.RESERVATION3)

      // different order
      response = await server.inject({
        method: 'GET',
        url: `/reservation?edition=${mocks.RESERVATION2.edition}&companyId=${mocks.RESERVATION2.companyId}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, mocks.RESERVATION2)
    })

    it('should give an empty list if no match is found', async function () {
      const response = await server.inject({
        method: 'GET',
        url: `/reservation?edition=null`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(0)
    })

    after('removing reservations from db', async function () {
      await Reservation.collection.drop()
    })
  })

  function expectToContain (list, obj) {
    const element = list.find((element) => (element.id === obj.id && element.companyId === obj.companyId && element.edition === obj.edition))
    expect(element).to.not.eql(undefined)
    Object.keys(obj).forEach(key => {
      expect(element[key]).to.eql(element[key])
    })
  }
})
