const mongoose = require('mongoose')
const path = require('path')
const logger = require('logger').getLogger()
const config = require(path.join(__dirname, '..', 'config'))
const mongoMethods = require(path.join(__dirname, '..', 'db'))

const MONGO_URL = `mongodb://localhost/${config.MONGO_DB}`

module.exports = {
  name: 'mongo',
  version: '1.0.0',
  register: async (server, options) => {
    mongoose.connect(MONGO_URL)

    var db = mongoose.connection
    db.on('error', (err) => {
      logger.error('Connection error')
      logger.error(`connection error: ${err.message}`)
    })
    db.once('open', function () {
      logger.info(`Connected to ${MONGO_URL}`)
    })

    server.method('link.delete', mongoMethods.link.delete)
  }
}
