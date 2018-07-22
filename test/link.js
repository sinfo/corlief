const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
const Link = require(path.join('..', 'db', 'models', 'link'))
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server

describe('link', async function () {
  describe('get', async function () {
    const linkData11 = new Link({
      companyId: 'oneCompany',
      edition: 'oneEdition',
      created: new Date(),
      token: 'oneToken',
      valid: true,
      participationDays: 1,
      activities: [],
      advertisementKind: 'oneAdv'
    })
    const linkData12 = new Link({
      companyId: 'oneCompany',
      edition: 'twoEdition',
      created: new Date(),
      token: 'twoToken',
      valid: true,
      participationDays: 2,
      activities: [],
      advertisementKind: 'twoAdv'
    })
    const linkData21 = new Link({
      companyId: 'twoCompany',
      edition: 'oneEdition',
      created: new Date(),
      token: 'threeToken',
      valid: true,
      participationDays: 2,
      activities: [],
      advertisementKind: 'twoAdv'
    })

    before('adding link to db', async function () {
      await linkData11.save()
      await linkData12.save()
      await linkData21.save()
    })

    it('should get a list of all links if no parameters are given', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/link`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(3)
      expectToContain(response.result, linkData11)
      expectToContain(response.result, linkData12)
      expectToContain(response.result, linkData21)
    })

    it('should give a list of links when one parameter is given', async function () {
      // companyId
      let response = await server.inject({
        method: 'GET',
        url: `/link?companyId=${linkData11.companyId}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(2)
      expectToContain(response.result, linkData11)
      expectToContain(response.result, linkData12)

      // edition
      response = await server.inject({
        method: 'GET',
        url: `/link?edition=${linkData11.edition}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(2)
      expectToContain(response.result, linkData11)
      expectToContain(response.result, linkData21)

      // token
      response = await server.inject({
        method: 'GET',
        url: `/link?token=${linkData11.token}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, linkData11)
    })

    it('should give a list of links when all parameters are given', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/link?companyId=${linkData21.companyId}&edition=${linkData21.edition}&token=${linkData21.token}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, linkData21)

      // different order
      response = await server.inject({
        method: 'GET',
        url: `/link?token=${linkData12.token}&edition=${linkData12.edition}&companyId=${linkData12.companyId}`
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, linkData12)
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

function expectToContain (list, obj) {
  const element = list.find((element) => (element.token === obj.token))
  expect(element).to.not.eql(undefined)
  Object.keys(obj).forEach(key => {
    expect(element[key]).to.eql(element[key])
  })
}
