let path = require('path')
let Config = require(path.join(__dirname, '..', 'models', 'config'))

async function create (edition) {
  let config = new Config({ edition: edition })
  return config.save()
}

module.exports.find = async () => {
  return Config.find()
}

module.exports.findByEdition = async (edition) => {
  let config = await Config.findOne({ edition: edition })
  return config === null ? create(edition) : config
}

module.exports.arrayToJSON = (configs) => {
  return configs.map(config => config.toJSON())
}
