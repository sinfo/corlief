const logger = require('logger').getLogger()

const config = {
  HOST: process.env.CORLIEF_HOST || 'localhost',
  PORT: process.env.CORLIEF_PORT || 8888,
  CORLIEF_PATH: process.env.NODE_ENV === 'production'
    ? process.env.CORLIEF_PATH
    : 'localhost:8888',

  MONGO: {
    DB: process.env.CORLIEF_MONGO_DB || 'corlief',
    TEST: process.env.CORLIEF_MONGO_DB_TEST || 'corlief_test',
    PORT: process.env.CORLIEF_MONGO_PORT || 27017
  },

  LOGENTRIES_TOKEN: process.env.CORLIEF_LOGENTRIES_TOKEN,

  STORAGE: {
    NAME: process.env.CORLIEF_STORAGE_NAME,
    KEY: process.env.CORLIEF_STORAGE_KEY,
    SECRET: process.env.CORLIEF_STORAGE_SECRET,
    REGION: process.env.CORLIEF_STORAGE_REGION,
    DOMAIN: process.env.CORLIEF_STORAGE_DOMAIN,
    PATH: process.env.NODE_ENV === 'production' ? '/corlief/production/' : '/corlief/dev/',
    TEST: '/corlief/test/'
  },

  DECK: {
    HOST: process.env.NODE_ENV === 'production' ? 'https://deck.sinfo.org' : 'http://localhost',
    PORT: process.env.NODE_ENV === 'production' ? 443 : 8080
  }
}

module.exports = config

module.exports.validate = () => {
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Running in production mode')

    if (config.CORLIEF_PATH === undefined) {
      logger.error('Env var of CORLIEF_PATH not defined')
      process.exit(1)
    }

    if (config.LOGENTRIES_TOKEN === undefined) {
      logger.warn('Production mode without logentries token given')
    }
  }

  for (let key of Object.keys(config.STORAGE)) {
    if (config.STORAGE[key] === undefined) {
      logger.error(`Env var of STORAGE.${key} not defined`)
      process.exit(1)
    }
  }
}
