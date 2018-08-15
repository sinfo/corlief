const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
const Link = require(path.join('..', 'db', 'models', 'link'))
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server

describe('link', async function () {
  describe('get', async function () {
    before('adding link to db', async function () {
      await new Link(mocks.LINK11).save()
      await new Link(mocks.LINK12).save()
      await new Link(mocks.LINK21).save()
    })

    it('should get a list of all links if no parameters are given', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/link`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(3)
      expectToContain(response.result, mocks.LINK11)
      expectToContain(response.result, mocks.LINK12)
      expectToContain(response.result, mocks.LINK21)
    })

    it('should give a list of links when one parameter is given', async function () {
      // companyId
      let response = await server.inject({
        method: 'GET',
        url: `/link?companyId=${mocks.LINK11.companyId}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(2)
      expectToContain(response.result, mocks.LINK11)
      expectToContain(response.result, mocks.LINK12)

      // edition
      response = await server.inject({
        method: 'GET',
        url: `/link?edition=${mocks.LINK11.edition}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(2)
      expectToContain(response.result, mocks.LINK11)
      expectToContain(response.result, mocks.LINK21)

      // token
      response = await server.inject({
        method: 'GET',
        url: `/link?token=${mocks.LINK11.token}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, mocks.LINK11)
    })

    it('should give a list of links when all parameters are given', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/link?companyId=${mocks.LINK21.companyId}&edition=${mocks.LINK21.edition}&token=${mocks.LINK21.token}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, mocks.LINK21)

      // different order
      response = await server.inject({
        method: 'GET',
        url: `/link?token=${mocks.LINK12.token}&edition=${mocks.LINK12.edition}&companyId=${mocks.LINK12.companyId}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, mocks.LINK12)
    })

    it('should give an empty list if no match is found', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/link?token=null`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(0)
    })

    after('removing links from db', async function () {
      await Link.collection.drop()
    })
  })

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
      await new Link(mocks.LINK).save()
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
/*
  describe('revoke', async function () {
    before('adding link to db', async function () {
      await new Link(mocks.LINK).save()
    })

    it('should be able to revoke an existing link', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/link/company/${mocks.LINK.companyId}/edition/${mocks.LINK.edition}/revoke`
      })

      let link = await Link.findOne({
        companyId: mocks.LINK.companyId,
        edition: mocks.LINK.edition
      })

      console.log(mocks.LINK.companyId, mocks.LINK.edition, mocks.LINK.valid)
      console.log(link.companyId, link.edition, link.valid)
      console.log(response.result)

      expect(response.statusCode).to.eql(200)
      expect(response.result.valid).to.eql(false)

      expect(link.valid).to.eql(false)
    })

    it('should give an error when trying to revoke a nonexisting link', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/link/company/nonexistent/edition/noEdition/revoke`
      })

      expect(response.statusCode).to.eql(422)
    })

    after('removing link from db', async function () {
      await Link.collection.drop()
    })
  }) */
})

function expectToContain (list, obj) {
  const element = list.find((element) => (element.token === obj.token))
  expect(element).to.not.eql(undefined)
  Object.keys(obj).forEach(key => {
    expect(element[key]).to.eql(element[key])
  })
}
