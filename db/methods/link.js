
let path = require('path')
let Link = require(path.join(__dirname, '..', 'models', 'link'))

module.exports.delete = async (companyId, edition) => {
  return Link.findOneAndRemove({ companyId: companyId, edition: edition })
}

module.exports.find = async (companyId, edition) => {
    return Link.findOne({ companyId: companyId, edition: edition })
}

