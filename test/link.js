const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
const Link = require(path.join('..', 'db', 'models', 'link'))
const mocks = require('./mocks')
let server

describe('link', function () {
  before('Starting server', function (done) {
    this.timeout(0)
    server = require(path.join(__dirname, '..', 'index'))

    server.events.on('start', function () {
      done()
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

    after('removing link to db', async function () {
      await Link.findOneAndRemove(mocks.LINK)
    })
  })

  after('Stopping server', function () {
    server.stop()
  })
})
