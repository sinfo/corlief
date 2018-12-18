const Boom = require('boom')
const logger = require('logger').getLogger()

module.exports = server => {
  server.auth.scheme('custom-sinfo', function (server, options) {
    return {
      authenticate: async function (request, h) {
        try {
          const authorization = request.headers.authorization

          if (!authorization) {
            throw Boom.unauthorized(null, 'custom-sinfo')
          }

          const parsed = authorization.split(' ')

          if (parsed.length < 2) {
            throw Boom.unauthorized(null, 'custom-sinfo')
          }

          const user = parsed[0]
          const token = parsed[1]

          let isValid = await request.server.methods.deck.validateToken(user, token)

          if (!isValid) {
            throw Boom.unauthorized(null, 'custom-sinfo')
          }

          return h.authenticated({ credentials: { user: user, token: token } })
        } catch (err) {
          logger.error({ info: request.info, error: err })
          throw Boom.unauthorized(null, 'custom-sinfo')
        }
      }
    }
  })

  server.auth.strategy('sinfo', 'custom-sinfo')
}
