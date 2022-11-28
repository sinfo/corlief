const aws = require('./aws')
const path = require('path')
const config = require(path.join(__dirname, '..', '..', 'config'))

const ROOT = process.env.NODE_ENV === 'test' ? config.STORAGE.TEST : config.STORAGE.PATH

function upload (dir, isPublic) {
  return (file, filename, edition, companyId) => {
    const path = dir === 'venue'
      ? `${ROOT}${edition}/venue`
      : `${ROOT}${edition}/${companyId}/${dir}`
    return aws.upload(path, file, filename, isPublic || false)
  }
}

function download (dir) {
  return (filename, edition, companyId) => {
    const path = dir === 'venue'
      ? `${ROOT}${edition}/venue`
      : `${ROOT}${edition}/${companyId}/${dir}`
    return aws.download(path, filename)
  }
}

function remove (dir) {
  return (filename, edition, companyId) => {
    const path = dir === 'venue'
      ? `${ROOT}${edition}/venue`
      : `${ROOT}${edition}/${companyId}/${dir}`
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

    server.method('files.venue.upload', upload('venue', true))
    server.method('files.venue.download', download('venue'))
    server.method('files.venue.remove', remove('venue'))

    server.method('files.contract.upload', upload('invoices', false))
    server.method('files.contract.download', download('invoices'))
    server.method('files.contract.remove', remove('invoices'))
  }
}
