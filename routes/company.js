const Joi = require('joi')
const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))

module.exports = [
  {
    method: 'GET',
    path: '/company/auth',
    config: {
      auth: 'company',
      tags: ['api'],
      description: 'Check token validation',
      handler: async (request, h) => {
        return request.auth.credentials
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown()
      },
      response: {
        schema: helpers.joi.credentials
      }
    }
  }
]
