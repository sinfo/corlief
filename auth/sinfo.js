const Boom = require('boom')
const logger = require('logger').getLogger()
const config = require('../config')
const { OAuth2Client } = require('google-auth-library')
const jwt = require('../plugins/jwt')

async function googleAuth(googleUserToken) {
  logger.info('[Google Auth] Verifying Google token.')
  const oAuth2Client = new OAuth2Client(config.AUTH.GOOGLE.CLIENT_ID, config.AUTH.GOOGLE.CLIENT_SECRET)
  let login = await oAuth2Client.verifyIdToken({
    idToken: googleUserToken,
    audience: config.AUTH.GOOGLE.CLIENT_ID
  }).catch((err) => {
    if (err) {
      logger.warn(err)
      throw Boom.boomify(err)
    }
  })
  
  // If verified we can trust in the login.payload
  logger.info('[Google Auth] Verification complete.')
  return authenticate(login.payload)
}

function authenticate(user) {
  logger.info('[Corlief Auth] Authenticating user...')
  const newToken = jwt.generate({
    user: user.email
  }, {
    expiresIn: config.AUTH.TOKEN_EXPIRY_DATE
  })

  const email = user.email.split('@')
  if (email[1] !== 'sinfo.org') {
    logger.info(`[Corlief Auth] User ${user.email} tried to authenticate and failed.`)
    throw Boom.unauthorized('User is not part of SINFO.')
  }

  logger.info('[Corlief Auth] Authenticated user ', user.email)
  return newToken
}

module.exports = server => {
  server.auth.strategy('sinfo', 'bearer-access-token', {
    validate: async (request, token, h) => {
      return jwt.verify(token)
    }
  })

  server.method('auth.google', googleAuth)
}
