const aws = require('./aws')
const path = require('path')
const config = require(path.join(__dirname, '..', '..', 'config'))

const ROOT = process.env.NODE_ENV === 'test' ? config.STORAGE.TEST : config.STORAGE.PATH

async function uploadLogo (edition, companyId, file, filename) {
  const path = `${ROOT}${edition}/${companyId}/logos`
  try {
    return await aws.upload(path, file, filename, true)
  } catch (err) {
    return null
  }
}

async function downloadLogo (edition, companyId, filename) {
  const path = `${ROOT}${edition}/${companyId}/logos`
  try {
    return await aws.download(path, filename)
  } catch (err) {
    return null
  }
}

async function removeLogo (edition, companyId, filename) {
  const path = `${ROOT}${edition}/${companyId}/logos`
  try {
    return await aws.delete(path, filename)
  } catch (err) {
    return null
  }
}

module.exports = {
  name: 'files',
  version: '1.0.0',
  register: async (server, options) => {
    server.method('files.uploadLogo', uploadLogo)
    server.method('files.downloadLogo', downloadLogo)
    server.method('files.removeLogo', removeLogo)
  }
}
