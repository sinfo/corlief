const logger = require('logger').getLogger()
const Boom = require('boom')
const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))

module.exports = [
  {
    method: 'GET',
    path: '/config/all',
    config: {
      tags: ['api'],
      description: 'Gets all the editions\' configurations',
      handler: async (request, h) => {
        try {
          let configs = await request.server.methods.config.find(request.query)
          return request.server.methods.config.arrayToJSON(configs)
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.configs
      }
    }
  },
  {
    method: 'GET',
    path: '/config',
    config: {
      tags: ['api'],
      description: 'Get current edition\'s configuration',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          let edition = request.pre.edition
          let config = await request.server.methods.config.findByEdition(edition)
          return config === null
            ? Boom.badData(`Couldn't create configuration for edition '${edition}'`)
            : config.toJSON()
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.config
      }
    }
  }
]
