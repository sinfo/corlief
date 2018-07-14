const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
let server

describe('link', function () {
  before('Starting server', function () {
    server = require(path.join(__dirname, '..', 'index'))
  })

  describe('test', function () {
    it('should pass', function () {
      expect(1).to.equal(1)
    })
  })

  after('Stopping server', function () {
    server.stop()
  })
})
