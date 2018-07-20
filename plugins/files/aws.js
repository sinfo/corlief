const aws = require('aws-sdk')
const path = require('path')
const config = require(path.join(__dirname, '..', '..', 'config'))

module.exports.download = (path, filename) => {
  let s3 = new aws.S3({
    endpoint: new aws.Endpoint(`https://${config.STORAGE.REGION}.${config.STORAGE.DOMAIN}${path}`),
    accessKeyId: config.STORAGE.KEY,
    secretAccessKey: config.STORAGE.SECRET
  })

  return new Promise((resolve, reject) => {
    s3.getObject({
      Bucket: config.STORAGE.NAME,
      Key: filename
    }, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

module.exports.upload = (path, buffer, filename, isPublic) => {
  let s3 = new aws.S3({
    endpoint: new aws.Endpoint(`https://${config.STORAGE.REGION}.${config.STORAGE.DOMAIN}${path}`),
    accessKeyId: config.STORAGE.KEY,
    secretAccessKey: config.STORAGE.SECRET
  })

  return new Promise((resolve, reject) => {
    s3.putObject({
      ACL: isPublic !== undefined && isPublic ? 'public-read' : 'authenticated-read',
      Body: buffer,
      Bucket: config.STORAGE.NAME,
      Key: filename
    }, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
