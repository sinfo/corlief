const config = {
  HOST: process.env.CORLIEF_HOST || 'localhost',
  PORT: process.env.CORLIEF_PORT || 8888,
  CORLIEF_PATH: process.env.CORLIEF_PATH || 'localhost:8888',

  MONGO: {
    DB: process.env.CORLIEF_MONGO_DB || 'corlief',
    TEST: process.env.CORLIEF_MONGO_DB_TEST || 'corlief_test',
    HOST: process.env.CORLIEF_MONGO_HOST || 'localhost:27017'
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
    HOST: process.env.CORLIEF_DECK_HOST || process.env.NODE_ENV === 'production' ? 'https://deck.sinfo.org' : 'https://deck-staging.sinfo.org',
    PORT: 443,
    USER: process.env.DECK_USER,
    TOKEN: process.env.DECK_TOKEN
  },

  COORDINATION_EMAIL: 'coordination@sinfo.org',

  MAILGUN: {
    API_KEY: process.env.CORLIEF_MAILGUN_API_KEY,
    DOMAIN: 'sinfo.org',
    HOST: 'api.mailgun.net'
  },

  CORS: process.env.NODE_ENV === 'production'
    ? ['*sinfo.org']
    : ['*'],

  SUBMISSIONS: {
    CONTRACTS: process.env.CORLIEF_SUBMISSIONS_CONTRACTS || true
  }
}

const logger = process.env.CORLIEF_LOGENTRIES_TOKEN &&
  config.MAILGUN.API_KEY &&
  process.env.NODE_ENV === 'production'
  ? require('logger').getLogger(
    process.env.CORLIEF_LOGENTRIES_TOKEN,
    config.MAILGUN.API_KEY,
    'Corlief'
  )
  : require('logger').getLogger()

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

    if (config.MAILGUN.API_KEY === undefined) {
      logger.error('Env var of CORLIEF_MAILGUN_API_KEY not defined')
      process.exit(1)
    }
  }

  for (let key of Object.keys(config.STORAGE)) {
    if (config.STORAGE[key] === undefined) {
      logger.error(`Env var of STORAGE.${key} not defined`)
      process.exit(1)
    }
  }
}
