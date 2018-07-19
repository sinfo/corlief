const auth = require('./authentication')

// const ROOT = process.env.NODE_ENV === 'test' ? config.STORAGE.TEST : config.STORAGE.PATH

// const VENUES_DIRNAME = 'venues'
// const LOGOS_DIRNAME = 'logos'
// const INVOICES_DIRNAME = 'invoices'

async function uploadLogo (edition, companyId, file, filename) {
}

async function downloadLogo (edition, companyId, filename) {
}

async function removeLogo (edition, companyId, filename) {

}

module.exports = {
  name: 'files',
  version: '1.0.0',
  register: async (server, options) => {
    console.log(JSON.stringify(auth.generateHeaders('GET', '/', { 'acl': '' }), null, 2))
    server.method('files.uploadLogo', uploadLogo)
    server.method('files.downloadLogo', downloadLogo)
    server.method('files.removeLogo', removeLogo)
  }
}
