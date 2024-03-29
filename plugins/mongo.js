const mongoose = require('mongoose')
const path = require('path')
const logger = require('logger').getLogger()
const config = require(path.join(__dirname, '..', 'config'))
const mongoMethods = require(path.join(__dirname, '..', 'db'))

const MONGO_URL = process.env.NODE_ENV === 'test'
  ? `mongodb://${config.MONGO.HOST}/${config.MONGO.TEST}`
  : `mongodb://${config.MONGO.HOST}/${config.MONGO.DB}`

module.exports = {
  name: 'mongo',
  version: '1.0.0',
  register: async (server, options) => {
    mongoose.connect(MONGO_URL,
      {
        useNewUrlParser: true,
        autoReconnect: true,
        reconnectTries: 1000,
        reconnectInterval: 5000
      })

    var db = mongoose.connection

    db.on('connecting', () => {
      logger.debug(`Trying to connect the daemon`)
    })

    db.on('disconnected', () => {
      logger.error(`Disconnected from the mongo daemon`)
    })

    db.on('error', (err) => {
      logger.error(`Connection error: ${err.message}`)
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
    server.method('link.setToken', mongoMethods.link.setToken)
    server.method('link.arrayToJSON', mongoMethods.venue.arrayToJSON)
    server.method('link.revoke', mongoMethods.link.revoke)
    server.method('link.update', mongoMethods.link.update)

    server.method('venue.arrayToJSON', mongoMethods.venue.arrayToJSON)
    server.method('venue.find', mongoMethods.venue.find)
    server.method('venue.updateImage', mongoMethods.venue.updateImage)
    server.method('venue.addStand', mongoMethods.venue.addStand)
    server.method('venue.removeStand', mongoMethods.venue.removeStand)
    server.method('venue.replaceStands', mongoMethods.venue.replaceStands)
    server.method('venue.addActivity', mongoMethods.venue.addActivity)
    server.method('venue.removeActivity', mongoMethods.venue.removeActivity)
    server.method('venue.replaceActivitySlots', mongoMethods.venue.replaceActivitySlots)

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
    server.method('reservation.getConfirmedReservations', mongoMethods.reservation.getConfirmedReservations)
    server.method('reservation.getPendingReservations', mongoMethods.reservation.getPendingReservations)
    server.method('reservation.companyReservations', mongoMethods.reservation.companyReservations)
    server.method('reservation.getLatestReservations', mongoMethods.reservation.getLatestReservations)
    server.method('reservation.confirm', mongoMethods.reservation.confirm)
    server.method('reservation.cancel', mongoMethods.reservation.cancel)
    server.method('reservation.remove', mongoMethods.reservation.remove)

    server.method('contract.arrayToJSON', mongoMethods.contract.arrayToJSON)
    server.method('contract.find', mongoMethods.contract.find)
    server.method('contract.findOne', mongoMethods.contract.findOne)
    server.method('contract.submitContract', mongoMethods.contract.submitContract)
    server.method('contract.deleteContract', mongoMethods.contract.deleteContract)
    server.method('contract.isContractAccepted', mongoMethods.contract.isContractAccepted)
    server.method('contract.confirm', mongoMethods.contract.confirm)
    server.method('contract.cancel', mongoMethods.contract.cancel)

    server.method('info.find', mongoMethods.info.find)
    server.method('info.findOne', mongoMethods.info.findOne)
    server.method('info.addInfo', mongoMethods.info.addInfo)
    server.method('info.isInfoValid', mongoMethods.info.isInfoValid)
    server.method('info.canSubmitInfo', mongoMethods.info.canSubmitInfo)
    server.method('info.confirm', mongoMethods.info.confirm)
    server.method('info.cancel', mongoMethods.info.cancel)
    server.method('info.arrayToJSON', mongoMethods.info.arrayToJSON)
  }
}
