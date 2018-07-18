const Client = require('ssh2-sftp-client')
const path = require('path')
const config = require(path.join(__dirname, '..', 'config'))

const ROOT = process.env.NODE_ENV === 'test' ? config.FTP.TEST : config.FTP.PATH
const CODES = {
  NOT_FOUND: 2,
  FAILURE: 4
}
const VENUES_DIRNAME = 'venues'
const LOGOS_DIRNAME = 'logos'
const INVOICES_DIRNAME = 'invoices'

const client = new Client()

const opt = {
  host: config.FTP.HOST,
  username: config.FTP.USER,
  password: config.FTP.PASS
}

async function createDirSetUp (path) {
  try {
    await client.mkdir(path)
  } catch (err) {
    if (err.code === undefined || err.code !== CODES.FAILURE) {
      client.end()
      throw err
    }
  }
}

async function setUp () {
  await client.connect(opt)

  await createDirSetUp(ROOT)
  await createDirSetUp(`${ROOT}/${VENUES_DIRNAME}`)
  await createDirSetUp(`${ROOT}/${LOGOS_DIRNAME}`)
  await createDirSetUp(`${ROOT}/${INVOICES_DIRNAME}`)

  client.end()
}

async function checkSetup () {
  try {
    await client.connect(opt)

    let dir = await client.list(ROOT)
    client.end()

    return dir.filter(d => d.name === VENUES_DIRNAME).length === 1 &&
      dir.filter(d => d.name === LOGOS_DIRNAME).length === 1 &&
      dir.filter(d => d.name === INVOICES_DIRNAME).length === 1
  } catch (err) {
    if (err.code && err.code === CODES.NOT_FOUND) {
      return false
    } else {
      client.end()
      throw err
    }
  }
}

async function setUpEdition (edition) {
  try {
    await setUp()
    await client.connect(opt)

    await createDirSetUp(`${ROOT}/${VENUES_DIRNAME}/${edition}`)
    await createDirSetUp(`${ROOT}/${LOGOS_DIRNAME}/${edition}`)
    await createDirSetUp(`${ROOT}/${INVOICES_DIRNAME}/${edition}`)

    client.end()
  } catch (err) {
    if (err.code === undefined || err.code !== CODES.NOT_FOUND) {
      client.end()
      throw err
    }
  }
}

async function uploadLogo (edition, companyId, file, filename) {
  let remotePath = `${ROOT}/${LOGOS_DIRNAME}/${edition}/${filename}`

  try {
    await client.connect(opt)
    await client.put(file, remotePath)

    client.end()
  } catch (err) {
    if (err.code && err.code === CODES.NOT_FOUND) {
      await setUpEdition(edition)
      await client.put(file, remotePath)
      client.end()
    } else {
      client.end()
      throw err
    }
  }
}

async function downloadLogo (edition, companyId, filename) {

}

async function removeLogo (edition, companyId, filename) {

}

module.exports = {
  name: 'files',
  version: '1.0.0',
  register: async (server, options) => {
    try {
      let setup = await checkSetup()
      if (!setup) {
        await setUp()
      }

      server.method('files.uploadLogo', uploadLogo)
      server.method('files.downloadLogo', downloadLogo)
      server.method('files.removeLogo', removeLogo)
    } catch (err) {
      throw err
    }
  }
}
