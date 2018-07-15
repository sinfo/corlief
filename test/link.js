const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
const Link = require(path.join('..', 'db', 'models', 'link'))
let server

describe('link', function () {
  before('Starting server', function (done) {
    this.timeout(0)
    server = require(path.join(__dirname, '..', 'index'))

    server.events.on('start', function () {
      done()
    })
  })

  describe('delete', function () {
    const newLinkData = {
      companyId: 'someCompany',
      edition: 'someEdition',
      created: new Date(),
      token: 'someToken',
      valid: true,
      participationDays: 3,
      activities: [],
      advertisementKind: 'someAdv'
    }

    before('adding link to db', async function () {
      let newLink = new Link(newLinkData)

      await newLink.save()
    })

    it('should be able to delete an existing link', async function () {
      let response = await server.inject({
        method: 'DELETE',
        url: `/link/company/${newLinkData.companyId}/edition/${newLinkData.edition}`
      })

      let link = await Link.findOne(newLinkData)

      expect(response.statusCode).to.eql(200)

      Object.keys(newLinkData).forEach(key => {
        expect(response.result[key]).to.eql(newLinkData[key])
      })

      expect(link).to.be.null
    })

    it('should give an error when trying to delete a nonexisting link', async function () {
      let response = await server.inject({
        method: 'DELETE',
        url: `/link/company/${newLinkData.companyId}_nonexistent/edition/${newLinkData.edition}`
      })

      expect(response.statusCode).to.eql(422)
    })

    after('removing link to db', async function () {
      await Link.findOneAndRemove(newLinkData)
    })
  })

  after('Stopping server', function () {
    server.stop()
  })
})
