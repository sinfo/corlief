const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
const Link = require(path.join('..', 'db', 'models', 'link'))
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server

describe('link', async function () {
  describe('add', async function () {
    const EXPIRATION = new Date().getTime() + 1000 * 60 * 60 * 24 * 31 * 5 // 5 months
    const MARGIN = 1000 * 5 // 5 seconds

    it('should return return the new link', async function () {
      let now = new Date().getTime()
      let response = await server.inject({
        method: 'POST',
        url: `/link`,
        payload: {
          companyId: mocks.LINK.companyId,
          participationDays: mocks.LINK.participationDays,
          activities: mocks.LINK.activities,
          advertisementKind: mocks.LINK.advertisementKind,
          expirationDate: EXPIRATION
        }
      })

      let link = response.result

      expect(response.statusCode).to.eql(200)
      expect(link.companyId).to.eql(mocks.LINK.companyId)
      expect(link.edition).to.not.be.null
      expect(link.created.getTime() > now).to.be.true
      expect((link.created.getTime() - now) < MARGIN).to.be.true
      expect(link.valid).to.be.true
      expect(link.participationDays).to.eql(mocks.LINK.participationDays)
      expect(link.activities).to.eql(mocks.LINK.activities)
      expect(link.advertisementKind).to.eql(mocks.LINK.advertisementKind)
    })

    after('removing link from db', async function () {
      await Link.collection.drop()
    })
  })

  describe('delete', async function () {
    before('adding link to db', async function () {
      let newLink = new Link(mocks.LINK)
      await newLink.save()
    })

    it('should be able to delete an existing link', async function () {
      let response = await server.inject({
        method: 'DELETE',
        url: `/link/company/${mocks.LINK.companyId}/edition/${mocks.LINK.edition}`
      })

      let link = await Link.findOne(mocks.LINK)

      expect(response.statusCode).to.eql(200)

      Object.keys(mocks.LINK).forEach(key => {
        expect(response.result[key]).to.eql(mocks.LINK[key])
      })

      expect(link).to.be.null
    })

    it('should give an error when trying to delete a nonexisting link', async function () {
      let response = await server.inject({
        method: 'DELETE',
        url: `/link/company/${mocks.LINK.companyId}_nonexistent/edition/${mocks.LINK.edition}`
      })

      expect(response.statusCode).to.eql(422)
    })

    after('removing link from db', async function () {
      await Link.collection.drop()
    })
  })
})
