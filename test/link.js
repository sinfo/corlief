const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
const Link = require(path.join('..', 'db', 'models', 'link'))
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server

describe('link', async function () {
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

  describe('update', async function () {
    before('adding link to db', async function () {
      let newLink = new Link(mocks.LINK)
      await newLink.save()
    })

    it('should be able to update an existing link', async function () {
      let response = await server.inject({
        method: 'PUT',
        url: `/link/company/${mocks.LINK.companyId}/edition/${mocks.LINK.edition}`,
        payload: {
          participationDays: 5,
          advertisementKind: 'someAdv2'
        }
      })

      let link = await Link.findOne({
        companyId: mocks.LINK.companyId,
        edition: mocks.LINK.edition
      })

      expect(response).to.not.be.null

      expect(response.statusCode).to.eql(200)

      expect(response.result.participationDays).to.eql(5)
      expect(response.result.advertisementKind).to.eql('someAdv2')
      expect(link.participationDays).to.eql(5)
      expect(link.advertisementKind).to.eql('someAdv2')
    })

    it('should give an error when trying to update a nonexisting link', async function () {
      let response = await server.inject({
        method: 'PUT',
        url: `/link/company/sinfo/edition/2018`
      })

      expect(response.statusCode).to.eql(400)
    })

    it('should do nothing when payload is empty', async function () {
      let response = await server.inject({
        method: 'PUT',
        url: `/link/company/${mocks.LINK.companyId}/edition/${mocks.LINK.edition}`,
        payload: {}
      })

      expect(response.statusCode).to.eql(200)

      let link = await Link.findOne({
        companyId: mocks.LINK.companyId,
        edition: mocks.LINK.edition
      })

      expect(link.participationDays).to.eql(5)
    })

    after('removing link from db', async function () {
      await Link.collection.drop()
    })
  })
})
