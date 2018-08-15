let path = require('path')
let Link = require(path.join(__dirname, '..', 'models', 'link'))

module.exports.create = async (companyId, edition, token, participationDays, activities, advertisementKind) => {
  return Link.create({
    companyId: companyId,
    edition: edition,
    created: new Date(),
    token: token,
    valid: true,
    participationDays: participationDays,
    activities: activities,
    advertisementKind: advertisementKind
  })
}

module.exports.delete = async (companyId, edition) => {
  return Link.findOneAndRemove({ companyId: companyId, edition: edition })
}

module.exports.find = async (filter) => {
  return Link.find(filter)
}

module.exports.findByToken = async (token) => {
  return Link.findOne({ token: token })
}

module.exports.revoke = async (companyId, edition) => {
  return Link.findOneAndUpdate(
    {companyId: companyId,
      edition: edition},
    {$set: {valid: false}},
    {new: true}
  )
}

module.exports.arrayToJSON = (venues) => {
  return venues.map(venue => venue.toJSON())
}
