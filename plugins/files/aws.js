const aws = require('aws-sdk')
const path = require('path')
const config = require(path.join(__dirname, '..', '..', 'config'))
const mime = require('mime-types')

function promiseWrapper (s3, key, params, returnData) {
  return new Promise((resolve, reject) => {
    s3[key](params, (err, data) => {
      if (err) {
        resolve(null)
      }

      resolve(returnData || data)
    })
  })
}

module.exports.download = (path, filename) => {
  let s3 = new aws.S3({
    endpoint: new aws.Endpoint(`https://${config.STORAGE.REGION}.${config.STORAGE.DOMAIN}${path}`),
    accessKeyId: config.STORAGE.KEY,
    secretAccessKey: config.STORAGE.SECRET
  })

  return promiseWrapper(s3, 'getObject', {
    Bucket: config.STORAGE.NAME,
    Key: filename
  })
}

module.exports.upload = (path, buffer, filename, isPublic) => {
  const s3 = new aws.S3({
    endpoint: new aws.Endpoint(`https://${config.STORAGE.REGION}.${config.STORAGE.DOMAIN}${path}`),
    accessKeyId: config.STORAGE.KEY,
    secretAccessKey: config.STORAGE.SECRET
  })

  return promiseWrapper(s3, 'putObject', {
    ACL: isPublic !== undefined && isPublic ? 'public-read' : 'authenticated-read',
    Body: buffer,
    Bucket: config.STORAGE.NAME,
    Key: filename,
    ContentType: mime.lookup(filename)
  }, `https://${config.STORAGE.NAME}.${config.STORAGE.REGION}.${config.STORAGE.DOMAIN}${path}/${filename}`)
}

module.exports.delete = (path, filename) => {
  let s3 = new aws.S3({
    endpoint: new aws.Endpoint(`https://${config.STORAGE.REGION}.${config.STORAGE.DOMAIN}${path}`),
    accessKeyId: config.STORAGE.KEY,
    secretAccessKey: config.STORAGE.SECRET
  })

  return promiseWrapper(s3, 'deleteObject', {
    Bucket: config.STORAGE.NAME,
    Key: filename
  })
}
