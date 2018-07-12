const logger = require('logger').getLogger()

module.exports = [
  {
    method: 'GET',
    path: '/hello',
    config: {
      tags: ['api'],
      description: 'Hello world documentation',
      notes: 'Hello world notes',
      handler: function (request, h) {
        logger.info('this is my thing')
        logger.error('error')
        return 'hello world'
      }
    }
  }
]
