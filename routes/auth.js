const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))
const Joi = require('joi')

module.exports = [
  {
    method: 'GET',
    path: '/auth',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Check\'s member authentication',
      handler: async (request, h) => {
        return request.auth.credentials
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown()
      },
      response: {
        schema: helpers.joi.sinfoCredentials
      }
    }
  }
]
