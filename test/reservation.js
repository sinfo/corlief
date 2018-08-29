const path = require('path')
const { before, after, it, describe, afterEach, beforeEach } = require('mocha')
const {expect} = require('chai')
const mocks = require('./mocks')
const Reservation = require(path.join('..', 'db', 'models', 'reservation'))
const Link = require(path.join('..', 'db', 'models', 'link'))
const Venue = require(path.join('..', 'db', 'models', 'venue'))
const server = require(path.join(__dirname, '..', 'app')).server
const streamToPromise = require('stream-to-promise')
const FormData = require('form-data')
const fs = require('fs')
const helpers = require('./helpers')

let sinfoCredentials

before('getting sinfo auth', async function () {
  sinfoCredentials = await helpers.sinfoCredentials()
})

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
        url: `/reservation`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
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
        url: `/reservation?companyId=${mocks.RESERVATION1.companyId}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(2)
      expectToContain(response.result, mocks.RESERVATION1)
      expectToContain(response.result, mocks.RESERVATION2)

      // edition
      response = await server.inject({
        method: 'GET',
        url: `/reservation?edition=${mocks.RESERVATION1.edition}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(2)
      expectToContain(response.result, mocks.RESERVATION1)
      expectToContain(response.result, mocks.RESERVATION3)
    })

    it('should give a list of reservations when all parameters are given', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/reservation?companyId=${mocks.RESERVATION3.companyId}&edition=${mocks.RESERVATION3.edition}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, mocks.RESERVATION3)

      // different order
      response = await server.inject({
        method: 'GET',
        url: `/reservation?edition=${mocks.RESERVATION2.edition}&companyId=${mocks.RESERVATION2.companyId}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, mocks.RESERVATION2)
    })

    it('should give an empty list if no match is found', async function () {
      const response = await server.inject({
        method: 'GET',
        url: `/reservation?edition=null`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(0)
    })

    after('removing reservations from db', async function () {
      await Reservation.collection.drop()
    })

    function expectToContain (list, obj) {
      const element = list.find((element) => (element.id === obj.id && element.companyId === obj.companyId && element.edition === obj.edition))
      expect(element).to.not.eql(undefined)
      Object.keys(obj).forEach(key => {
        expect(element[key]).to.eql(element[key])
      })
    }
  })

  describe('confirm reservation', async function () {
    const ON_TIME = new Date().getTime() + 1000 * 60 * 60 * 24 * 31 * 5 // 5 months
    let token1, token2

    let stands = [
      mocks.STAND1, mocks.STAND2, mocks.STAND3, mocks.STAND4
    ]

    let venue, stands1, stands2

    before('create links, make venue and reservations', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/link`,
        payload: {
          companyId: mocks.LINK.companyId,
          participationDays: mocks.LINK.participationDays,
          activities: mocks.LINK.activities,
          advertisementKind: mocks.LINK.advertisementKind,
          expirationDate: ON_TIME
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res4 = await server.inject({
        method: 'POST',
        url: `/link`,
        payload: {
          companyId: mocks.LINK3.companyId,
          participationDays: mocks.LINK3.participationDays,
          activities: mocks.LINK3.activities,
          advertisementKind: mocks.LINK3.advertisementKind,
          expirationDate: ON_TIME
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      await Link.findOneAndUpdate({
        companyId: mocks.INVALID_LINK.companyId
      }, { $set: { valid: false } }, { new: true })

      token1 = res1.result.token
      token2 = res4.result.token

      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, headers, { Authorization: sinfoCredentials.authenticator })

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      expect(res.statusCode).to.eql(200)

      for (let stand of stands) {
        let res = await server.inject({
          method: 'POST',
          url: `/venue/stand`,
          payload: stand,
          headers: {
            Authorization: sinfoCredentials.authenticator
          }
        })

        venue = res.result

        expect(res.statusCode).to.eql(200)
      }

      stands1 = [
        {
          day: 1,
          standId: venue.stands[0].id
        },
        {
          day: 2,
          standId: venue.stands[1].id
        },
        {
          day: 3,
          standId: venue.stands[2].id
        }
      ]

      stands2 = [
        {
          day: 4,
          standId: venue.stands[1].id
        },
        {
          day: 5,
          standId: venue.stands[2].id
        }
      ]

      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token2}`
        },
        payload: stands2
      })

      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)

      expect(res1.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
    })

    it('should be able to confirm a pending reservation', async function () {
      let res = await server.inject({
        method: 'GET',
        url: `/reservation/company/${mocks.LINK.companyId}/confirm`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let reservations = await Reservation.find()

      for (let reservation of reservations) {
        if (reservation.companyId === mocks.LINK.companyId) {
          expect(reservation.feedback.status).to.eql('CONFIRMED')
        } else {
          expect(reservation.feedback.status).to.eql('PENDING')
        }
      }

      expect(res.statusCode).to.eql(200)
      expect(res.result.feedback.status).to.eql('CONFIRMED')
      expect(res.result.feedback.member).to.eql(sinfoCredentials.id)
    })

    it('should be able to confirm a cancelled reservation', async function () {
      await Reservation.findOneAndUpdate(
        { companyId: mocks.LINK.companyId },
        { 'feedback.status': 'CANCELLED' }
      )

      let res = await server.inject({
        method: 'GET',
        url: `/reservation/company/${mocks.LINK.companyId}/confirm`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let reservations = await Reservation.find()

      for (let reservation of reservations) {
        if (reservation.companyId === mocks.LINK.companyId) {
          expect(reservation.feedback.status).to.eql('CONFIRMED')
        } else {
          expect(reservation.feedback.status).to.eql('PENDING')
        }
      }

      expect(res.statusCode).to.eql(200)
      expect(res.result.feedback.status).to.eql('CONFIRMED')
      expect(res.result.feedback.member).to.eql(sinfoCredentials.id)
    })

    it('should give an error if no reservation is found', async function () {
      let res = await server.inject({
        method: 'GET',
        url: `/reservation/company/______/confirm`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    afterEach('removing reservations from db', async function () {
      try {
        await Reservation.update({}, { 'feedback.status': 'PENDING' }, { multi: true })
      } catch (err) {
        // do nothing
      }
    })

    after('removing all from db', async function () {
      await Venue.collection.drop()
      await Link.collection.drop()
      await Reservation.collection.drop()
    })
  })

  describe('cancel reservation', async function () {
    const ON_TIME = new Date().getTime() + 1000 * 60 * 60 * 24 * 31 * 5 // 5 months
    let token1, token2

    let stands = [
      mocks.STAND1, mocks.STAND2, mocks.STAND3, mocks.STAND4
    ]

    let venue, stands1, stands2

    before('create links and make venue', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/link`,
        payload: {
          companyId: mocks.LINK.companyId,
          participationDays: mocks.LINK.participationDays,
          activities: mocks.LINK.activities,
          advertisementKind: mocks.LINK.advertisementKind,
          expirationDate: ON_TIME
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res4 = await server.inject({
        method: 'POST',
        url: `/link`,
        payload: {
          companyId: mocks.LINK3.companyId,
          participationDays: mocks.LINK3.participationDays,
          activities: mocks.LINK3.activities,
          advertisementKind: mocks.LINK3.advertisementKind,
          expirationDate: ON_TIME
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      await Link.findOneAndUpdate({
        companyId: mocks.INVALID_LINK.companyId
      }, { $set: { valid: false } }, { new: true })

      token1 = res1.result.token
      token2 = res4.result.token

      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, headers, { Authorization: sinfoCredentials.authenticator })

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      expect(res.statusCode).to.eql(200)

      for (let stand of stands) {
        let res = await server.inject({
          method: 'POST',
          url: `/venue/stand`,
          payload: stand,
          headers: {
            Authorization: sinfoCredentials.authenticator
          }
        })

        venue = res.result

        expect(res.statusCode).to.eql(200)
      }

      stands1 = [
        {
          day: 1,
          standId: venue.stands[0].id
        },
        {
          day: 2,
          standId: venue.stands[1].id
        },
        {
          day: 3,
          standId: venue.stands[2].id
        }
      ]

      stands2 = [
        {
          day: 4,
          standId: venue.stands[1].id
        },
        {
          day: 5,
          standId: venue.stands[2].id
        }
      ]

      expect(res1.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
    })

    beforeEach('make reservations', async function () {
      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token2}`
        },
        payload: stands2
      })

      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
    })

    it('should be able to cancel a reservation', async function () {
      let res = await server.inject({
        method: 'DELETE',
        url: `/reservation/company/${mocks.LINK.companyId}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(200)
      expect(res.result.companyId).to.eql(mocks.LINK.companyId)
      expect(res.result.feedback.status).to.eql('CANCELLED')
      expect(res.result.feedback.member).to.eql(sinfoCredentials.id)
    })

    it('should be able to cancel a confirmed reservation', async function () {
      await Reservation.findOneAndUpdate(
        { companyId: mocks.LINK.companyId },
        { 'feedback.status': 'CONFIRMED' }
      )

      let res = await server.inject({
        method: 'DELETE',
        url: `/reservation/company/${mocks.LINK.companyId}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(200)
      expect(res.result.companyId).to.eql(mocks.LINK.companyId)
      expect(res.result.feedback.status).to.eql('CANCELLED')
      expect(res.result.feedback.member).to.eql(sinfoCredentials.id)
    })

    it('should not be able to cancel a non existing reservation', async function () {
      await Reservation.findOneAndRemove({ companyId: mocks.LINK.companyId })

      let res = await server.inject({
        method: 'DELETE',
        url: `/reservation/company/${mocks.LINK.companyId}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('removing links and venue from db', async function () {
      await Venue.collection.drop()
      await Link.collection.drop()
    })

    afterEach('removing reservations', async function () {
      await Reservation.collection.drop()
    })
  })

  describe('get latest reservations', async function () {
    const ON_TIME = new Date().getTime() + 1000 * 60 * 60 * 24 * 31 * 5 // 5 months
    let token1, token2

    let stands = [
      mocks.STAND1, mocks.STAND2, mocks.STAND3, mocks.STAND4
    ]

    let venue, stands1, stands2

    before('create links and make venue', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/link`,
        payload: {
          companyId: mocks.LINK.companyId,
          participationDays: mocks.LINK.participationDays,
          activities: mocks.LINK.activities,
          advertisementKind: mocks.LINK.advertisementKind,
          expirationDate: ON_TIME
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res4 = await server.inject({
        method: 'POST',
        url: `/link`,
        payload: {
          companyId: mocks.LINK3.companyId,
          participationDays: mocks.LINK3.participationDays,
          activities: mocks.LINK3.activities,
          advertisementKind: mocks.LINK3.advertisementKind,
          expirationDate: ON_TIME
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      await Link.findOneAndUpdate({
        companyId: mocks.INVALID_LINK.companyId
      }, { $set: { valid: false } }, { new: true })

      token1 = res1.result.token
      token2 = res4.result.token

      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      expect(res.statusCode).to.eql(200)

      for (let stand of stands) {
        let res = await server.inject({
          method: 'POST',
          url: `/venue/stand`,
          payload: stand,
          headers: {
            Authorization: sinfoCredentials.authenticator
          }
        })

        venue = res.result

        expect(res.statusCode).to.eql(200)
      }

      stands1 = [
        {
          day: 1,
          standId: venue.stands[0].id
        },
        {
          day: 2,
          standId: venue.stands[1].id
        },
        {
          day: 3,
          standId: venue.stands[2].id
        }
      ]

      stands2 = [
        {
          day: 4,
          standId: venue.stands[1].id
        },
        {
          day: 5,
          standId: venue.stands[2].id
        }
      ]

      expect(res1.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
    })

    it('should return an empty array if there are no reservations', async function () {
      let res = await server.inject({
        method: 'GET',
        url: '/reservation/latest',
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(200)
      expect(res.result).to.be.an('array')
      expect(res.result).to.be.empty
    })

    it('should return an array with one element if only one reservation was made', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'GET',
        url: '/reservation/latest',
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let reservation = res1.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res2.result).to.be.an('array')
      expect(res2.result.length).to.eql(1)
      expect(res2.result[0]).to.deep.eql(reservation)
    })

    it('should get the latest reservation (confirmed)', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'GET',
        url: `/reservation/company/${mocks.LINK.companyId}/confirm`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'GET',
        url: '/reservation/latest',
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let reservation = res2.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)

      expect(res3.result).to.be.an('array')
      expect(res3.result.length).to.eql(1)
      expect(res3.result[0]).to.deep.eql(reservation)
    })

    it('should get the latest reservation (new pending)', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'DELETE',
        url: `/reservation/company/${mocks.LINK.companyId}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res4 = await server.inject({
        method: 'GET',
        url: '/reservation/latest',
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let reservation = res3.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)

      expect(res4.result).to.be.an('array')
      expect(res4.result.length).to.eql(1)
      expect(res4.result[0]).to.deep.eql(reservation)
    })

    it('should return all the latest reservations (2 companies, 1 reservation modified)', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'GET',
        url: `/reservation/company/${mocks.LINK.companyId}/confirm`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token2}`
        },
        payload: stands2
      })

      let res4 = await server.inject({
        method: 'GET',
        url: '/reservation/latest',
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let reservation1 = res2.result
      let reservation2 = res3.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)

      expect(res4.result).to.be.an('array')
      expect(res4.result.length).to.eql(2)
      expect(res4.result).to.deep.include(reservation1)
      expect(res4.result).to.deep.include(reservation2)
    })

    it('should return all the latest reservations (2 companies, 2 reservations modified)', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'GET',
        url: `/reservation/company/${mocks.LINK.companyId}/confirm`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token2}`
        },
        payload: stands2
      })

      let res4 = await server.inject({
        method: 'GET',
        url: `/reservation/company/${mocks.LINK3.companyId}/confirm`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'GET',
        url: '/reservation/latest',
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let reservation1 = res2.result
      let reservation2 = res4.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)

      expect(res5.result).to.be.an('array')
      expect(res5.result.length).to.eql(2)
      expect(res5.result).to.deep.include(reservation1)
      expect(res5.result).to.deep.include(reservation2)
    })

    it('should return just the latest reservation of the company on the query', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'GET',
        url: `/reservation/company/${mocks.LINK.companyId}/confirm`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token2}`
        },
        payload: stands2
      })

      let res4 = await server.inject({
        method: 'GET',
        url: `/reservation/company/${mocks.LINK3.companyId}/confirm`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'GET',
        url: `/reservation/latest?companyId=${mocks.LINK.companyId}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let reservation1 = res2.result
      let reservation2 = res4.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)

      expect(res5.result).to.be.an('array')
      expect(res5.result.length).to.eql(1)
      expect(res5.result).to.deep.include(reservation1)
      expect(res5.result).to.not.deep.include(reservation2)
    })

    afterEach('remove reservations', async function () {
      try {
        await Reservation.collection.drop()
      } catch (err) {}
    })

    after('removing all from db', async function () {
      await Venue.collection.drop()
      await Link.collection.drop()
    })
  })
})
