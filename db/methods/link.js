let path = require('path')
let Link = require(path.join(__dirname, '..', 'models', 'link'))

module.exports.delete = async (companyId, edition) => {
  return Link.findOneAndRemove({ companyId: companyId, edition: edition })
}

module.exports.find = async (filter) => {
  return Link.find(filter)
}

module.exports.arrayToJSON = (venues) => {
  return venues.map(venue => venue.toJSON())
}

module.exports.update = async (id, edition, pDays, adKind) => {
  let update = Link.findOneAndUpdate(
    {
      companyId: id,
      edition: edition
    },
    { $set: {
      participationDays: pDays,
      advertisementKind: adKind
    }},
    {new: true}
  )
  return update
}
