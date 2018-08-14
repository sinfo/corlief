const Joi = require('joi')
// const path = require('path')
// const helpers = require(path.join(__dirname, '..', 'helpers'))
// const Boom = require('boom')

module.exports = [
  {
    method: 'GET',
    path: '/reservation',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Test',
      handler: async (request, h) => {
        return request.auth.credentials
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown()
      }
    }
  }
]
