const config = require('../config')
const loggerGenerator = require('logger')

module.exports = {
  name: 'logger',
  version: '1.0.0',
  register: async (server, options) => {
    let logger = loggerGenerator.getLogger(config.LOGENTRIES_TOKEN)

    if (process.env.NODE_ENV !== 'test') {
      server.events.on('response', (request) => {
        if (request.url.path.indexOf('/swagger') === -1) {
          logger.info(`method=${request.method.toUpperCase()} path=${request.url.path}`, 'request')
        }
      })

      server.events.on('start', () => {
        logger.info(`Server running at: ${server.info.uri}`)
      })
    }
  }
}
