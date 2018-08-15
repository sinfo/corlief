function getDataFromStream (stream) {
  return new Promise((resolve, reject) => {
    let data = []

    stream.on('data', (chunk) => {
      data.push(chunk)
    })

    stream.on('end', () => {
      resolve(Buffer.concat(data))
    })

    stream.on('error', (err) => {
      reject(err)
    })
  })
}

module.exports.edition = {
  method: async (request, h) => {
    const edition = await request.server.methods.deck.getLatestEdition()
    return edition.id
  },
  assign: 'edition'
}

module.exports.duration = {
  method: async (request, h) => {
    const edition = await request.server.methods.deck.getLatestEdition()
    return new Date(edition.duration).getDate()
  },
  assign: 'duration'
}

module.exports.isCompanyValid = {
  method: async (request, h) => {
    const companyId = request.payload.companyId

    return request.server.methods.deck.validateCompanyId(companyId)
  },
  assign: 'isCompanyValid'
}

module.exports.token = {
  method: async (request, h) => {
    const edition = request.pre.edition
    const companyId = request.payload.companyId
    const expirationDate = request.payload.expirationDate

    return request.server.methods.jwt.generate(edition, companyId, expirationDate)
  },
  assign: 'token'
}

module.exports.file = {
  method: async (request, h) => {
    const filename = request.payload.file.hapi.filename
    const data = await getDataFromStream(request.payload.file)
    const extension = filename.split('.').length > 1
      ? '.' + filename.split('.')[filename.split('.').length - 1]
      : ''

    return {
      filename: filename,
      data: data,
      extension: extension
    }
  },
  assign: 'file'
}

module.exports.link = {
  method: async (request, h) => {
    const token = request.auth.artifacts
    return request.server.methods.link.findByToken(token)
  },
  assign: 'link'
}

module.exports.config = {
  method: async (request, h) => {
    let edition = request.pre.edition
    return request.server.methods.config.findByEdition(edition)
  },
  assign: 'config'
}

module.exports.venue = {
  method: async (request, h) => {
    const edition = request.pre.edition
    return request.server.methods.venue.find({ edition: edition })
  },
  assign: 'venue'
}
