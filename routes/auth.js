const Boom = require('boom')
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
  },
  {
    method: 'POST',
    path: '/auth/google',
    config: {
      auth: {
        strategies: ['sinfo'],
        mode: 'try'
      },
      validate: {
        payload: Joi.object({
          user: Joi.string().required().description('google id of the member'),
          token: Joi.string().required().description('google token of the member')
        })
      },
      description: 'Google login'
    },
    handler: async function (request, h) {
      try {
        let member = await request.server.methods.auth.google(request.payload.token);
        return h.response(member)
      } catch (err) {
        throw Boom.unauthorized(`User "${request.payload.id}" could not login with google.`)
      }
    }
  }
]
