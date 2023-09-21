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

  logger.info('[Corlief Auth] Authenticated user ', user.email )
  return newToken
}

module.exports = server => {
  server.auth.strategy('sinfo', 'bearer-access-token', {
    allowQueryToken: true,
    allowMultipleHeaders: true,
    accessTokenName: 'access_token',
    validate: jwt.verify
  })

  server.method('auth.google', googleAuth)
}
