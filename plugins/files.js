const Client = require('ssh2-sftp-client')
const path = require('path')
const config = require(path.join(__dirname, '..', 'config'))

const ROOT = process.env.NODE_ENV === 'test' ? config.FTP.TEST : config.FTP.PATH
const client = new Client()

const opt = {
  host: config.FTP.HOST,
  username: config.FTP.USER,
  password: config.FTP.PASS
}

async function setUp (client) {
  try {
    await client.list(ROOT)
  } catch (err) {
    if (err.code === 2) {
      // No such file
      await client.mkdir(ROOT)
    } else {
      throw err
    }
  }
}

module.exports = {
  name: 'files',
  version: '1.0.0',
  register: async (server, options) => {
    try {
      await client.connect(opt)
      await setUp(client)
      client.end()
    } catch (err) {
      console.error(err.code)
    }
  }
}
