let path = require('path')
let Link = require(path.join(__dirname, '..', 'models', 'link'))

const ommit = { _id: 0, __v: 0 }

module.exports.delete = async (companyId, edition) => {
  return Link.findOneAndRemove({ companyId: companyId, edition: edition }, { projection: ommit }).lean()
}

module.exports.find = async (filter) => {
  return Link.find(filter, ommit).lean()
}
