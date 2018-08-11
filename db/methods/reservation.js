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

module.exports.arrayToJSON = arrayToJSON
module.exports.find = find
module.exports.findOne = findOne
module.exports.addStands = addStands
module.exports.isConfirmed = isConfirmed
