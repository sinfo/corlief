const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

const PRIVATE_KEY_PATH = path.join(__dirname, '..', 'keys', 'jwtRS256.key')
const PUBLIC_KEY_PATH = path.join(__dirname, '..', 'keys', 'jwtRS256.key.pub')

const privateKey = fs.readFileSync(PRIVATE_KEY_PATH) // eslint-disable-line security/detect-non-literal-fs-filename
const publicKey = fs.readFileSync(PUBLIC_KEY_PATH) // eslint-disable-line security/detect-non-literal-fs-filename

async function generate (edition, company, expirationDate) {
  return jwt.sign(
    {
      exp: Math.floor(expirationDate / 1000),
      edition: edition,
      company: company
    },
    privateKey,
    {
      algorithm: 'RS256'
    }
  )
}

async function verify (token) {
  return jwt.verify(token, publicKey)
}

module.exports = {
  name: 'jwt',
  version: '1.0.0',
  register: async (server, options) => {
    server.method('jwt.generate', generate)
    server.method('jwt.verify', verify)
  }
}
