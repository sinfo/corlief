module.exports = {
  HOST: process.env.CORLIEF_HOST || 'localhost',
  PORT: process.env.CORLIEF_PORT || 8888,

  MONGO_DB: process.env.CORLIEF_MONGO_DB || 'corlief',

  LOGENTRIES_TOKEN: process.env.CORLIEF_LOGENTRIES_TOKEN
}
