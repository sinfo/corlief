module.exports = {
  HOST: process.env.CORLIEF_HOST || 'localhost',
  PORT: process.env.CORLIEF_PORT || 8888,

  MONGO: {
    DB: process.env.CORLIEF_MONGO_DB || 'corlief',
    TEST: process.env.CORLIEF_MONGO_DB_TEST || 'corlief_test',
    PORT: process.env.CORLIEF_MONGO_PORT || 27017
  },

  LOGENTRIES_TOKEN: process.env.CORLIEF_LOGENTRIES_TOKEN,

  FTP: {
    HOST: process.env.CORLIEF_FTP_HOST,
    USER: process.env.CORLIEF_FTP_USER,
    PASS: process.env.CORLIEF_FTP_PASS,
    PATH: process.env.CORLIEF_FTP_PATH || '/home/sinfo/corlief/dev',
    TEST: process.env.CORLIEF_FTP_PATH || '/home/sinfo/corlief/test'
  },

  DECK: {
    HOST: process.env.NODE_ENV === 'production' ? 'https://deck.sinfo.org' : 'http://localhost',
    PORT: process.env.NODE_ENV === 'production' ? 443 : 8080
  }

}
