const logger = require('logger').getLogger()

module.exports = [
  {
    method: 'GET',
    path: '/helloworld',
    config: {
      tags: ['api'],
      description: 'Hello world documentation',
      notes: 'Hello world notes',
      handler: async (request, h) => {
        logger.info('This is me logging')
        return 'hello world'
      }
    }
  }
]
