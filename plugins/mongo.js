const mongoose = require('mongoose')
const path = require('path')
const logger = require('logger').getLogger()
const config = require(path.join(__dirname, '..', 'config'))

module.exports = {
  name: 'mongo',
  version: '1.0.0',
  register: async (server, options) => {
    mongoose.connect(`mongodb://localhost/${config.MONGO_DB}`)

    var db = mongoose.connection
    db.on('error', console.error.bind(logger.error, 'connection error:'))
    db.once('open', function () {
      logger.info('Mongodb connected')
    })

    // install server methods here
  }
}
