module.exports = [
  require('./logger'),
  require('./jwt'),
  require('./mongo'),
  require('./deck'),
  require('./files'),
  require('hapi-auth-bearer-token'),
  require('./mailgun')
]
