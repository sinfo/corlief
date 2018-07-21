let path = require('path')
let Link = require(path.join(__dirname, '..', 'models', 'link'))

const ommitedFields = { _id: 0, __v: 0 }

module.exports.delete = async (companyId, edition) => {
  return Link.findOneAndRemove({ companyId: companyId, edition: edition }, { fields: ommitedFields })
}

module.exports.find = async (filter) => {
  return Link.find(filter, ommitedFields)
}
