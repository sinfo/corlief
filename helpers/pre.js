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
    let edition = await request.server.methods.deck.getLatestEdition()
    return edition.id
  },
  assign: 'edition'
}

module.exports.file = {
  method: async (request, h) => {
    let filename = request.payload.file.hapi.filename
    let data = await getDataFromStream(request.payload.file)
    let extension = filename.split('.').length > 1
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
