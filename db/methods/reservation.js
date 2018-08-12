let path = require('path')
let Reservation = require(path.join(__dirname, '..', 'models', 'reservation'))

function arrayToJSON (reservations) {
  return reservations.map(reservation => reservation.toJSON())
}

async function find (filter) {
  return Reservation.find(filter)
}

async function findOne (id, companyId, edition) {
  return Reservation.findOne({
    id: id,
    companyId: companyId,
    edition: edition
  })
}

async function addReservation (newId, companyId, edition, stands) {
  let newReservation = new Reservation({
    id: newId,
    companyId: companyId,
    edition: edition,
    stands: stands
  })

  return newReservation.save()
}

async function addStands (companyId, edition, stands) {
  let latest = await Reservation.getLatest(companyId, edition)

  if (latest === null || latest.feedback.status === 'CANCELLED') {
    let newId = latest !== null
      ? latest.id + 1
      : 0

    return addReservation(newId, companyId, edition, stands)
  }
  return latest.addStands(stands)
}

async function isConfirmed (companyId, edition) {
  let response = {
    result: false,
    error: null
  }

  let latest = await Reservation.getLatest(companyId, edition)

  if (latest === null) {
    return response
  }

  if (latest.feedback.status === 'CONFIRMED') {
    response.result = true
    response.error = 'Reservation confirmed'
    return response
  }

  return response
}

async function isStandAvailable (companyId, edition, stand) {
  let confirmed = await Reservation.getConfirmedReservations(edition)

  if (confirmed.length === 0) { return true }

  for (let reservation of confirmed) {
    let stands = reservation.stands

    for (let s of stands) {
      if (s.day === stand.day && s.standId === stand.standId) {
        return false
      }
    }
  }

  return true
}

async function getLatest (companyId, edition) {
  return Reservation.getLatest(companyId, edition)
}

async function areConsecutive (latest, stands) {
  let savedStands = latest && latest.stands.length > 0 ? latest.stands : []

  stands = stands.filter(stand => {
    for (let ss of savedStands) {
      if (ss.day === stand.day) {
        return false
      }
    }

    return true
  })

  stands = stands.concat(savedStands)
  stands = stands.sort((s1, s2) => s1.day > s2.day)

  for (let i = 0; i < stands.length - 1; i++) {
    if (stands[i].standId !== stands[i + 1].standId || stands[i].day !== stands[i + 1].day - 1) {
      return false
    }
  }

  return true
}

module.exports.arrayToJSON = arrayToJSON
module.exports.find = find
module.exports.findOne = findOne
module.exports.addStands = addStands
module.exports.isConfirmed = isConfirmed
module.exports.isStandAvailable = isStandAvailable
module.exports.getLatest = getLatest
module.exports.areConsecutive = areConsecutive
