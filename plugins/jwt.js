const Boom = require('boom')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const config = require('../config')
const logger = require('logger').getLogger()

const PRIVATE_KEY_PATH = path.join(__dirname, '..', 'keys', 'jwtRS256.key')
const PUBLIC_KEY_PATH = path.join(__dirname, '..', 'keys', 'jwtRS256.key.pub')

const privateKey = fs.readFileSync(PRIVATE_KEY_PATH) // eslint-disable-line security/detect-non-literal-fs-filename
const publicKey = fs.readFileSync(PUBLIC_KEY_PATH) // eslint-disable-line security/detect-non-literal-fs-filename

async function generate (data, options) {
  if (options === undefined) {
    options = {}
  }

  options.algorithm = config.AUTH.TOKEN_ALGORITHM
  options.issuer = config.AUTH.TOKEN_ISSUER

  return jwt.sign(
    data,
    privateKey,
    options
  )
}

async function verify (token) {
  try {
    const decoded = jwt.verify(token, publicKey)
    return decoded
          ? { isValid: true, credentials: decoded, artifacts: token }
          : { isValid: false, credentials: token, artifacts: token }
  } catch (err) {
    throw Boom.unauthorized(err)
  }
}

module.exports = {
  name: 'jwt',
  version: '1.0.0',
  register: async (server, options) => {
    server.method('jwt.generate', generate)
    server.method('jwt.verify', verify)
  }
}

module.exports.generate = generate
module.exports.verify = verify