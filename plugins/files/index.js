const aws = require('./aws')
const path = require('path')
const config = require(path.join(__dirname, '..', '..', 'config'))

const ROOT = process.env.NODE_ENV === 'test' ? config.STORAGE.TEST : config.STORAGE.PATH

function upload (dir, isPublic) {
  return (edition, companyId, file, filename) => {
    const path = `${ROOT}${edition}/${companyId}/${dir}`
    return aws.upload(path, file, filename, isPublic || false)
  }
}

function download (dir) {
  return (edition, companyId, filename) => {
    const path = `${ROOT}${edition}/${companyId}/${dir}`
    return aws.download(path, filename)
  }
}

function remove (dir) {
  return (edition, companyId, filename) => {
    const path = `${ROOT}${edition}/${companyId}/${dir}`
    return aws.delete(path, filename)
  }
}

module.exports = {
  name: 'files',
  version: '1.0.0',
  register: async (server, options) => {
    server.method('files.logo.upload', upload('logos', true))
    server.method('files.logo.download', download('logos'))
    server.method('files.logo.remove', remove('logos'))

    server.method('files.venue.upload', upload('venues', true))
    server.method('files.venue.download', download('venues'))
    server.method('files.venue.remove', remove('venues'))

    server.method('files.invoice.upload', upload('invoices', false))
    server.method('files.invoice.download', download('invoices'))
    server.method('files.invoice.remove', remove('invoices'))
  }
}
