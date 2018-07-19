module.exports = {
  HOST: process.env.CORLIEF_HOST || 'localhost',
  PORT: process.env.CORLIEF_PORT || 8888,

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
    PATH: process.env.CORLIEF_STORAGE_PATH || '/',
    TEST: process.env.CORLIEF_STORAGE_TEST || '/test/'
  },

  DECK: {
    HOST: process.env.NODE_ENV === 'production' ? 'https://deck.sinfo.org' : 'http://localhost',
    PORT: process.env.NODE_ENV === 'production' ? 443 : 8080
  }

}
