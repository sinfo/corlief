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

describe('company', async function () {
  const ON_TIME = new Date().getTime() + 1000 * 60 * 60 * 24 * 31 * 5 // 5 months
  let token1, token2

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
      }
    })

    await Link.findOneAndUpdate({
      companyId: mocks.INVALID_LINK.companyId
    }, { $set: { valid: false } }, { new: true })

    token1 = res1.result.token
    token2 = res4.result.token

    expect(res1.statusCode).to.eql(200)
    expect(res4.statusCode).to.eql(200)
  })

  describe('confirm reservation', async function () {
    let stands = [
      mocks.STAND1, mocks.STAND2, mocks.STAND3, mocks.STAND4
    ]

    let venue, stands1, stands2

    before('prepare venue and stands and make reservations', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

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
          payload: stand
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
    })

    it('should be able to confirm a pending reservation', async function () {
      let res = await server.inject({
        method: 'GET',
        url: `/reservation/company/${mocks.LINK.companyId}/confirm`
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
    })

    it('should be able to confirm a cancelled reservation', async function () {
      await Reservation.findOneAndUpdate(
        { companyId: mocks.LINK.companyId },
        { 'feedback.status': 'CANCELLED' }
      )

      let res = await server.inject({
        method: 'GET',
        url: `/reservation/company/${mocks.LINK.companyId}/confirm`
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
    })

    it('should give an error if no reservation is found', async function () {
      let res = await server.inject({
        method: 'GET',
        url: `/reservation/company/______/confirm`
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

    after('removing venue and reservations from db', async function () {
      await Venue.collection.drop()
      await Reservation.collection.drop()
    })
  })

  after('removing links from db', async function () {
    await Link.collection.drop()
  })
})
