const aws = require('./aws')
const path = require('path')
const config = require(path.join(__dirname, '..', '..', 'config'))

const ROOT = process.env.NODE_ENV === 'test' ? config.STORAGE.TEST : config.STORAGE.PATH

async function uploadLogo (edition, companyId, file, filename) {
  const path = `${ROOT}${edition}/${companyId}/logos`
  return aws.upload(path, file, filename, true)
}

async function downloadLogo (edition, companyId, filename) {
}

async function removeLogo (edition, companyId, filename) {
}

module.exports = {
  name: 'files',
  version: '1.0.0',
  register: async (server, options) => {
    let file = require('fs').readFileSync('./config.js')

    try {
      let result = await uploadLogo('myEdition', 'myCompany', file, 'newIndex.js')
      console.log(result)
    } catch (err) {
      console.error(err)
    }

    server.method('files.uploadLogo', uploadLogo)
    server.method('files.downloadLogo', downloadLogo)
    server.method('files.removeLogo', removeLogo)
  }
}
