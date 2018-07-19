const moment = require('moment')
const crypto = require('crypto')
const strictUriEncode = require('strict-uri-encode')
const path = require('path')
const config = require(path.join(__dirname, '..', '..', 'config'))

function hash (data) {
  const h = crypto.createHash('sha256')
  h.update(data)
  return h.digest('hex')
}

function getSignature (date, data) {
  let dateKeyHmac = crypto.createHmac('sha256', 'AWS4' + config.STORAGE.SECRET)
  let dateKey = dateKeyHmac.update(date).toString('hex')

  let dateRegionKeyHmac = crypto.createHmac('sha256', dateKey)
  let dateRegionKey = dateRegionKeyHmac.update(config.STORAGE.REGION).toString('hex')

  let dateRegionServiceKeyHmac = crypto.createHmac('sha256', dateRegionKey)
  let dateRegionServiceKey = dateRegionServiceKeyHmac.update('s3').toString('hex')

  let signingKeyHmac = crypto.createHmac('sha256', dateRegionServiceKey)
  let signingKey = signingKeyHmac.update('aws4_request').toString('hex')

  let signatureHmac = crypto.createHmac('sha256', signingKey)
  return signatureHmac.update(data).digest('hex')
}

function getCanonicalQuery (query) {
  let queryString = ''

  for (let key of Object.keys(query)) {
    queryString += `${key}=${query[key]}&`
  }

  queryString = queryString.slice(0, -1) // remove last '&'

  let encoded = strictUriEncode(queryString)
  encoded = encoded.replace(/%3D/g, '=').replace(/%26/g, '&')
  encoded = encoded.split('&').sort().join('&')

  return encoded
}

function getCanonicalHeaders (headers) {
  // Watch out!
  // DO not use headers like header1 and header2, as this sort function will sort
  // alphabetically, and will put header2 before header1

  let headersKeys = Object.keys(headers).sort()
  let headersString = ''

  for (let key of headersKeys) {
    headersString += `${key.toLowerCase()}:${headers[key].trim()}\n`
  }

  return headersString
}

module.exports.generateHeaders = (method, path, query, payload, isPublic) => {
  let date = moment().format('YYMMDD')
  let dateISO = moment().format('YMMDDTHHmmss') + 'Z'

  let authHeaders = {
    Authorization: 'AWS4-HMAC-SHA256',
    Credentials: `${config.STORAGE.KEY}/${date}/${config.STORAGE.REGION}/s3/aws4_request`,
    SignedHeaders: 'host;x-amz-content-sha256;x-amz-date'
  }

  let hashedPayload = hash(payload === undefined ? '' : payload)

  let awsHeaders = {
    'Host': `${config.STORAGE.NAME}.${config.STORAGE.REGION}.${config.STORAGE.DOMAIN}`,
    'x-amz-content-sha256': hashedPayload,
    'x-amz-date': dateISO
  }

  let canonicalRequest = method + '\n'
  canonicalRequest += `https://${config.STORAGE.NAME}.${config.STORAGE.REGION}.${config.STORAGE.DOMAIN}\n`
  canonicalRequest += strictUriEncode(path).replace(/%2F/g, '/') + '\n'
  canonicalRequest += query === undefined ? '' : getCanonicalQuery(query) + '\n'
  canonicalRequest += getCanonicalHeaders(awsHeaders) + '\n'
  canonicalRequest += authHeaders.SignedHeaders + '\n'
  canonicalRequest += hashedPayload + '\n'

  console.log('canonical request\n' + canonicalRequest)

  let data = authHeaders.Authorization + '\n'
  data += dateISO + '\n'
  data += `${date}/${config.REGION}/s3/aws4_request\n`
  data += hash(canonicalRequest)

  authHeaders.Signature = getSignature(date, data)

  return Object.assign(authHeaders, awsHeaders)
}
