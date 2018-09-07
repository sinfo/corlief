const path = require('path')
const { before, after, it, describe, afterEach } = require('mocha')
const {expect} = require('chai')
const Link = require(path.join('..', 'db', 'models', 'link'))
const Venue = require(path.join('..', 'db', 'models', 'venue'))
const Reservation = require(path.join('..', 'db', 'models', 'reservation'))
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server
const streamToPromise = require('stream-to-promise')
const FormData = require('form-data')
const fs = require('fs')
const helpers = require('./helpers')

let sinfoCredentials

before('getting sinfo auth', async function () {
  sinfoCredentials = await helpers.sinfoCredentials()
})

describe('company', async function () {
  const ON_TIME = new Date().getTime() + 1000 * 60 * 60 * 24 * 31 * 5 // 5 months
  const TO_EXPIRE = new Date().getTime() + 1000 // 1 second
  let token1, token2, toExpireToken, invalidToken

  before('create links', async function () {
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

    let res2 = await server.inject({
      method: 'POST',
      url: `/link`,
      payload: {
        companyId: mocks.LINK2.companyId,
        participationDays: mocks.LINK2.participationDays,
        activities: mocks.LINK2.activities,
        advertisementKind: mocks.LINK2.advertisementKind,
        expirationDate: TO_EXPIRE
      },
      headers: {
        Authorization: sinfoCredentials.authenticator
      }
    })

    let res3 = await server.inject({
      method: 'POST',
      url: `/link`,
      payload: {
        companyId: mocks.INVALID_LINK.companyId,
        participationDays: mocks.INVALID_LINK.participationDays,
        activities: mocks.INVALID_LINK.activities,
        advertisementKind: mocks.INVALID_LINK.advertisementKind,
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
    toExpireToken = res2.result.token
    invalidToken = res3.result.token
    token2 = res4.result.token

    expect(res1.statusCode).to.eql(200)
    expect(res2.statusCode).to.eql(200)
    expect(res3.statusCode).to.eql(200)
    expect(res4.statusCode).to.eql(200)
  })

  describe('auth', async function () {
    it('should return the token information', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/company/auth`,
        headers: {
          Authorization: `bearer ${token1}`
        }
      })

      let credentials = response.result

      expect(response.statusCode).to.eql(200)
      expect(credentials.company).to.eql(mocks.LINK.companyId)
    })

    it('should fail authentication if expired', async function () {
      setTimeout(async function () {
        let response = await server.inject({
          method: 'GET',
          url: `/company/auth`,
          headers: {
            Authorization: `bearer ${toExpireToken}`
          }
        })

        expect(response.statusCode).to.eql(401)
      }, 2000)
    })

    it('should fail authentication if invalidated by team', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/company/auth`,
        headers: {
          Authorization: `bearer ${invalidToken}`
        }
      })

      expect(response.statusCode).to.eql(401)
    })

    it('should fail if no authentication is provided', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/company/auth`
      })

      expect(response.statusCode).to.eql(401)
    })

    it('should fail if invalid token is provided', async function () {
      let res1 = await server.inject({
        method: 'GET',
        url: `/company/auth`,
        headers: {
          Authorization: 'bearer abc'
        }
      })

      let res2 = await server.inject({
        method: 'GET',
        url: `/company/auth`,
        headers: {
          Authorization: 'abc'
        }
      })

      let res3 = await server.inject({
        method: 'GET',
        url: `/company/auth`,
        headers: {
          Authorization: ''
        }
      })

      expect(res1.statusCode).to.eql(401)
      expect(res2.statusCode).to.eql(401)
      expect(res3.statusCode).to.eql(401)
    })
  })

  describe('make reservation', async function () {
    let stands = [
      mocks.STAND1, mocks.STAND2, mocks.STAND3, mocks.STAND4
    ]

    let venue, stands1, stands2

    before('prepare venue and stands', async function () {
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
    })

    it('should be able to make reservations', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token2}`
        },
        payload: stands2
      })

      let reservation1 = res1.result
      let reservation2 = res2.result

      expect(res1.statusCode).to.eql(200)
      expect(reservation1).to.be.an('object')
      expect(reservation1.id).to.eql(0)
      expect(reservation1.companyId).to.eql(mocks.LINK.companyId)
      expect(reservation1.stands).to.eql(stands1)
      expect(reservation1.feedback.status).to.eql('PENDING')

      expect(res2.statusCode).to.eql(200)
      expect(reservation2).to.be.an('object')
      expect(reservation2.id).to.eql(0)
      expect(reservation2.companyId).to.eql(mocks.LINK3.companyId)
      expect(reservation2.stands).to.eql(stands2)
      expect(reservation2.feedback.status).to.eql('PENDING')
    })

    it('should be able to make reservations after cancellation', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      await Reservation.findOneAndUpdate(
        { id: 0, companyId: mocks.LINK.companyId },
        { 'feedback.status': 'CANCELLED' })

      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
    })

    it('should fail if the payload has the wrong format or is empty', async function () {
      let res0 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: []
      })

      expect(res0.statusCode).to.eql(400)
    })

    it('should fail if the number of reservations does not match the participation days', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: [ stands1[0] ]
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: [ stands1[0], stands1[1] ]
      })

      let res4 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: [ stands1[0], stands1[1], stands2[0], stands2[1] ]
      })

      expect(res1.statusCode).to.eql(422)
      expect(res2.statusCode).to.eql(422)
      expect(res4.statusCode).to.eql(422)
    })

    it('should fail if the company has a pending reservation', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(423)
    })

    it('should fail if the company has a confirmed reservation', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      await Reservation.findOneAndUpdate(
        { id: 0, companyId: mocks.LINK.companyId },
        { 'feedback.status': 'CONFIRMED' })

      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(423)
    })

    it('should fail if the stands are not valid', async function () {
      let invalidStands = []

      for (let stand of stands1) {
        invalidStands.push({
          day: stand.day,
          standId: stand.standId + 20
        })
      }

      let res = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: invalidStands
      })

      expect(res.statusCode).to.eql(422)
    })

    it('should fail if the stands are already occupied', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token2}`
        },
        payload: stands1
      })

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(422)
    })

    afterEach('removing reservations from db', async function () {
      try {
        await Reservation.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    after('removing venue from db', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {

      }
    })
  })

  describe('cancel reservation', async function () {
    let stands = [
      mocks.STAND1, mocks.STAND2, mocks.STAND3, mocks.STAND4
    ]

    let venue, stands1

    before('prepare venue and stands', async function () {
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
    })

    it('should be able to cancel existing reservation', async function () {
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
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let reservation1 = res1.result
      let reservation2 = res2.result

      expect(res1.statusCode).to.eql(200)
      expect(reservation1).to.be.an('object')
      expect(reservation1.feedback.status).to.eql('PENDING')

      expect(res2.statusCode).to.eql(200)
      expect(reservation2).to.be.an('object')
      expect(reservation2.feedback.status).to.eql('CANCELLED')
    })

    it('should fail if it was already removed', async function () {
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
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res3 = await server.inject({
        method: 'DELETE',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let reservation1 = res1.result
      let reservation2 = res2.result

      expect(res1.statusCode).to.eql(200)
      expect(reservation1).to.be.an('object')
      expect(reservation1.feedback.status).to.eql('PENDING')

      expect(res2.statusCode).to.eql(200)
      expect(reservation2).to.be.an('object')
      expect(reservation2.feedback.status).to.eql('CANCELLED')

      expect(res3.statusCode).to.eql(422)
    })

    it('should be able to make reservations after cancellation', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      await Reservation.findOneAndUpdate(
        { id: 0, companyId: mocks.LINK.companyId },
        { 'feedback.status': 'CANCELLED' })

      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
    })

    it('should fail if there are no reservations', async function () {
      let res1 = await server.inject({
        method: 'DELETE',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      expect(res1.statusCode).to.eql(422)
    })

    afterEach('removing reservations from db', async function () {
      try {
        await Reservation.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    after('removing venue from db', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
      }
    })
  })

  describe('get stands\'s availability', async function () {
    let stands = [
      mocks.STAND1, mocks.STAND2, mocks.STAND3, mocks.STAND4
    ]

    let venue, stands1, stands2

    before('prepare venue and stands', async function () {
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
    })

    it('should represent the stand\'s availability in case of confirmed reservation', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token2}`
        },
        payload: stands2
      })

      let reservation1 = res1.result
      let reservation2 = res2.result

      await Reservation.findOneAndUpdate(reservation1, { 'feedback.status': 'CONFIRMED' })
      await Reservation.findOneAndUpdate(reservation2, { 'feedback.status': 'CONFIRMED' })

      let res = await server.inject({
        method: 'GET',
        url: `/company/venue`,
        headers: {
          Authorization: `bearer ${token1}`
        }
      })

      let avail = res.result.availability

      expect(res.statusCode).to.eql(200)
      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)

      for (let day of avail) {
        for (let stand of day.stands) {
          let found = false

          for (let stands of [stands1, stands2]) {
            for (let s of stands) {
              if (s.id === stand.id && s.day === stand.day) {
                expect(stand.free).to.not.be.true
                found = true
                break
              }

              if (found) { break }
              expect(stand.free).to.be.true
            }
          }
        }
      }
    })

    it('should show that all stands are available if no reservation is confimed', async function () {
      let res = await server.inject({
        method: 'GET',
        url: `/company/venue`,
        headers: {
          Authorization: `bearer ${token1}`
        }
      })

      let avail = res.result.availability

      expect(res.statusCode).to.eql(200)
      for (let day of avail) {
        for (let stand of day.stands) {
          expect(stand.free).to.be.true
        }
      }
    })

    it('should not show occupied stands if pending reservation', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token2}`
        },
        payload: stands2
      })

      let res = await server.inject({
        method: 'GET',
        url: `/company/venue`,
        headers: {
          Authorization: `bearer ${token1}`
        }
      })

      let avail = res.result.availability

      expect(res.statusCode).to.eql(200)
      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      for (let day of avail) {
        for (let stand of day.stands) {
          expect(stand.free).to.be.true
        }
      }
    })

    it('should not show occupied stands if pending reservation', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token2}`
        },
        payload: stands2
      })

      let res = await server.inject({
        method: 'GET',
        url: `/company/venue`,
        headers: {
          Authorization: `bearer ${token1}`
        }
      })

      let reservation1 = res1.result
      let reservation2 = res2.result

      await Reservation.findOneAndUpdate(reservation1, { 'feedback.status': 'CANCELLED' })
      await Reservation.findOneAndUpdate(reservation2, { 'feedback.status': 'CANCELLED' })

      let avail = res.result.availability

      expect(res.statusCode).to.eql(200)
      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      for (let day of avail) {
        for (let stand of day.stands) {
          expect(stand.free).to.be.true
        }
      }
    })

    it('should return an error if no venue corresponding with the latest edition is created', async function () {
      await Venue.findOneAndRemove({ edition: venue.edition })

      let res = await server.inject({
        method: 'GET',
        url: `/company/venue`,
        headers: {
          Authorization: `bearer ${token1}`
        }
      })

      expect(res.statusCode).to.eql(422)

      let newVenue = new Venue(venue)
      await newVenue.save()
    })

    afterEach('removing reservations from db', async function () {
      try {
        await Reservation.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    after('removing venue from db', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })
  })

  describe('get reservation', async function () {
    let stands = [
      mocks.STAND1, mocks.STAND2, mocks.STAND3, mocks.STAND4
    ]

    let venue, stands1, res1

    before('prepare venue, stands and make reservations', async function () {
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

      res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: stands1
      })
    })

    it('should be able to get reservations', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/company/reservation?latest=true`,
        headers: {
          Authorization: `bearer ${token1}`
        }
      })

      expect(res1.statusCode).to.eql(200)
      expect(response.result[0]).to.eql(res1.result)
    })

    it('should return empty array when no reservation', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/company/reservation?latest=true`,
        headers: {
          Authorization: `bearer ${token2}`
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result).to.eql([])
    })

    after('removing venue from db', async function () {
      try {
        await Reservation.collection.drop()
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })
  })

  after('removing links from db', async function () {
    try {
      await Link.collection.drop()
    } catch (err) {
      // do nothing
    }
  })
})
