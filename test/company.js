const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
const Link = require(path.join('..', 'db', 'models', 'link'))
const Venue = require(path.join('..', 'db', 'models', 'venue'))
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server
const streamToPromise = require('stream-to-promise')
const FormData = require('form-data')
const fs = require('fs')

describe('company', async function () {
  const ON_TIME = new Date().getTime() + 1000 * 60 * 60 * 24 * 31 * 5 // 5 months
  const TO_EXPIRE = new Date().getTime() + 1000 // 1 second
  let token1, toExpireToken, invalidToken

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

    let res2 = await server.inject({
      method: 'POST',
      url: `/link`,
      payload: {
        companyId: mocks.LINK2.companyId,
        participationDays: mocks.LINK2.participationDays,
        activities: mocks.LINK2.activities,
        advertisementKind: mocks.LINK2.advertisementKind,
        expirationDate: TO_EXPIRE
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
        expirationDate: TO_EXPIRE
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
      companyId: mocks.INVALID_LINK.company,
      edition: mocks.INVALID_LINK.edition
    }, { $set: { valid: false } })

    token1 = res1.result.token
    toExpireToken = res2.result.token
    invalidToken = res3.result.token
    // token2 = res4.result.token

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

    before('prepare venue and stands', async function () {
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

        expect(res.statusCode).to.eql(200)
      }
    })

    it('should be able to make reservations', async function () {
      /*
      let res1 = await server.inject({
        method: 'POST',
        url: `/company/reservation`,
        headers: {
          Authorization: `bearer ${token1}`
        },
        payload: {

        }
        */
    })

    it('should fail if the number of reservations does not match with the participation days', async function () {

    })

    it('should fail if the company has a pending reservation', async function () {

    })

    it('should fail if the company has a confirmed reservation', async function () {

    })

    it('should fail if the stands are not valid', async function () {

    })

    it('should fail if the stands are already occupied', async function () {

    })

    after('removing venue from db', async function () {
      await Venue.collection.drop()
    })
  })

  after('removing links from db', async function () {
    await Link.collection.drop()
  })
})
