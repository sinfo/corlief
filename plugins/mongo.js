const mongoose = require('mongoose')
const path = require('path')
const logger = require('logger').getLogger()
const config = require(path.join(__dirname, '..', 'config'))
const mongoMethods = require(path.join(__dirname, '..', 'db'))

const MONGO_URL = process.env.NODE_ENV === 'test'
  ? `mongodb://localhost:${config.MONGO.PORT}/${config.MONGO.TEST}`
  : `mongodb://localhost:${config.MONGO.PORT}/${config.MONGO.DB}`

module.exports = {
  name: 'mongo',
  version: '1.0.0',
  register: async (server, options) => {
    mongoose.connect(MONGO_URL, { useNewUrlParser: true })

    var db = mongoose.connection
    db.on('error', (err) => {
      logger.error('Connection error')
      logger.error(`connection error: ${err.message}`)
    })

    if (process.env.NODE_ENV !== 'test') {
      db.once('open', function () {
        logger.info(`Connected to ${MONGO_URL}`)
      })
    }

    server.method('link.create', mongoMethods.link.create)
    server.method('link.delete', mongoMethods.link.delete)
    server.method('link.find', mongoMethods.link.find)
    server.method('link.findByToken', mongoMethods.link.findByToken)
    server.method('link.arrayToJSON', mongoMethods.venue.arrayToJSON)
    server.method('link.revoke', mongoMethods.link.revoke)

    server.method('venue.arrayToJSON', mongoMethods.venue.arrayToJSON)
    server.method('venue.find', mongoMethods.venue.find)
    server.method('venue.updateImage', mongoMethods.venue.updateImage)
    server.method('venue.addStand', mongoMethods.venue.addStand)
    server.method('venue.removeStand', mongoMethods.venue.removeStand)
    server.method('venue.replaceStands', mongoMethods.venue.replaceStands)

    server.method('config.find', mongoMethods.config.find)
    server.method('config.findByEdition', mongoMethods.config.findByEdition)
    server.method('config.arrayToJSON', mongoMethods.config.arrayToJSON)

    server.method('reservation.arrayToJSON', mongoMethods.reservation.arrayToJSON)
    server.method('reservation.find', mongoMethods.reservation.find)
    server.method('reservation.findOne', mongoMethods.reservation.findOne)
    server.method('reservation.addStands', mongoMethods.reservation.addStands)
    server.method('reservation.areAvailable', mongoMethods.reservation.areAvailable)
    server.method('reservation.canMakeReservation', mongoMethods.reservation.canMakeReservation)
    server.method('reservation.areConsecutive', mongoMethods.reservation.areConsecutive)
    server.method('reservation.areValid', mongoMethods.reservation.areValid)
  }
}
