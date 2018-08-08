const path = require('path')
const { afterEach, it, describe } = require('mocha')
const {expect} = require('chai')
const Config = require(path.join('..', 'db', 'models', 'config'))
const server = require(path.join(__dirname, '..', 'app')).server

describe('config', function () {
  this.timeout(0)
  describe('get config', async function () {
    it('should create a new configuration if none is set', async function () {
      let res = await server.inject({
        method: 'GET',
        url: `/config`
      })

      let config = res.result
      let configFromDB = await Config.findOne({ edition: config.edition })

      expect(res.statusCode).to.eql(200)

      expect(configFromDB).to.not.be.null
      expect(configFromDB.toJSON()).to.eql(config)
    })

    it('should get the current config', async function () {
      let res1 = await server.inject({
        method: 'GET',
        url: `/config`
      })

      let res2 = await server.inject({
        method: 'GET',
        url: `/config`
      })

      let config1 = res1.result
      let config2 = res2.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)

      expect(config2).to.not.be.null
      expect(config1).to.eql(config2)
    })

    it('should get all configs', async function () {
      let res1 = await server.inject({
        method: 'GET',
        url: `/config/all`
      })

      let res2 = await server.inject({
        method: 'GET',
        url: `/config`
      })

      let res3 = await server.inject({
        method: 'GET',
        url: `/config/all`
      })

      let configs1 = res1.result
      let configs2 = res3.result
      let config = res2.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)

      expect(configs1).to.be.an('array')
      expect(configs1.length).to.eql(0)

      expect(configs2).to.be.an('array')
      expect(configs2.length).to.eql(1)
      expect(configs2[0]).to.eql(config)
    })

    afterEach('cleaning up db', async function () {
      try {
        await Config.collection.drop()
      } catch (err) {
        // do nothing
      }
    })
  })
})
