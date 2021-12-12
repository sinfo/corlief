let path = require('path')
let Link = require(path.join(__dirname, '..', 'models', 'link'))

module.exports.create = async (
  companyId, companyName,
  edition, memberEmail, token, participationDays,
  activities, advertisementKind, companyEmail
) => {
  const contacts = companyEmail
    ? { company: companyEmail, member: memberEmail }
    : { member: memberEmail }

  return Link.create({
    companyId: companyId,
    companyName: companyName,
    contacts: contacts,
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
    {
      companyId: companyId,
      edition: edition
    },
    { $set: { valid: false } },
    { new: true }
  )
}

module.exports.arrayToJSON = (links) => {
  return links.map(link => link.toJSON())
}

module.exports.setToken = async (query, token) => {
  return Link.findOneAndUpdate(
    query,
    { $set: { token: token, valid: true } },
    { new: true }
  )
}

module.exports.update = async (id, edition, pDays, adKind, companyContact, memberContact, activities) => {
  let changes = {}

  if (pDays) {
    changes.participationDays = pDays
  }

  if (adKind) {
    changes.advertisementKind = adKind
  }

  if (companyContact || memberContact) {
    changes.contacts = {}

    if (companyContact) {
      changes.contacts.company = companyContact
    }

    if (memberContact) {
      changes.contacts.member = memberContact
    }
  }
  if (activities) {
    changes.activities = activities
  }

  let update = Link.findOneAndUpdate(
    {
      companyId: id,
      edition: edition
    },
    { $set: changes },
    { new: true }
  )
  return update
}
