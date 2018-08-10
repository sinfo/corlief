const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
const Link = require(path.join('..', 'db', 'models', 'link'))
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server

describe('company', async function () {
  const ON_TIME = new Date().getTime() + 1000 * 60 * 60 * 24 * 31 * 5 // 5 months
  const TO_EXPIRE = new Date().getTime() + 1000 // 1 second
  let token1, token2, token3

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

    await Link.findOneAndUpdate({
      companyId: mocks.INVALID_LINK.company,
      edition: mocks.INVALID_LINK.edition
    }, { $set: { valid: false } })

    token1 = res1.result.token
    token2 = res2.result.token
    token3 = res3.token

    expect(res1.statusCode).to.eql(200)
    expect(res2.statusCode).to.eql(200)
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
            Authorization: `bearer ${token2}`
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
          Authorization: `bearer ${token3}`
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

  after('removing links from db', async function () {
    await Link.collection.drop()
  })
})
