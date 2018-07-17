module.exports = {
  HOST: process.env.CORLIEF_HOST || 'localhost',
  PORT: process.env.CORLIEF_PORT || 8888,

  MONGO_DB: process.env.CORLIEF_MONGO_DB || 'corlief',
  MONGO_DB_TEST: process.env.CORLIEF_MONGO_DB_TEST || 'corlief_test',
  MONGO_PORT: process.env.CORLIEF_MONGO_PORT || 27017,

  LOGENTRIES_TOKEN: process.env.CORLIEF_LOGENTRIES_TOKEN,

  FILES_PATH: process.env.CORLIEF_FILES_PATH || `${__dirname}/data/`,

  DECK_HOST: process.env.NODE_ENV === 'production' ? 'https://deck.sinfo.org' : 'http://localhost',
  DECK_PORT: process.env.NODE_ENV === 'production' ? 443 : 8080
}
