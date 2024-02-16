/* eslint-disable space-before-function-paren */
let path = require('path')
let Reservation = require(path.join(__dirname, '..', 'models', 'reservation'))

function arrayToJSON(reservations) {
  return reservations.map(reservation => reservation.toJSON())
}

async function find(filter) {
  return Reservation.find(filter)
}

async function findOne(id, companyId, edition) {
  return Reservation.findOne({
    id: id,
    companyId: companyId,
    edition: edition
  })
}

async function addReservation(newId, companyId, edition, stands, activities) {
  let newReservation = new Reservation({
    id: newId,
    companyId: companyId,
    edition: edition,
    stands: stands,
    activities: activities
  })

  return newReservation.save()
}

async function addStands(companyId, edition, stands, activities) {
  let latest = await Reservation.getLatest(companyId, edition)

  if (latest === null || latest.feedback.status === 'CANCELLED') {
    let newId = latest !== null
      ? latest.id + 1
      : 0

    return addReservation(newId, companyId, edition, stands, activities)
  }
  return latest.addStands(stands, activities)
}

async function canMakeReservation(companyId, edition) {
  let response = {
    result: true,
    confirmed: false,
    error: null
  }

  let latest = await Reservation.getLatest(companyId, edition)

  if (latest === null) {
    return response
  }

  if (latest.feedback.status === 'CONFIRMED') {
    response.result = false
    response.confirmed = true
    response.error = 'Reservation confirmed'
    return response
  }

  if (latest.feedback.status === 'PENDING') {
    response.result = false
    response.error = 'Pending reservation'
    return response
  }

  return response
}

async function areConsecutive(stands) {
  stands = stands.sort((s1, s2) => s1.day > s2.day)

  for (let i = 0; i < stands.length - 1; i++) {
    if (stands[i].standId !== stands[i + 1].standId || stands[i].day !== stands[i + 1].day - 1) {
      return false
    }
  }

  return true
}

async function isStandAvailable(confirmedStands, pendingStands, stand) {
  if (confirmedStands.length === 0 && pendingStands.length === 0) { return true }

  for (let reservation of confirmedStands) {
    let stands = reservation.stands

    for (let s of stands) {
      if (s.day === stand.day && s.standId === stand.standId) {
        return false
      }
    }
  }

  for (let reservation of pendingStands) {
    let stands = reservation.stands

    for (let s of stands) {
      if (s.day === stand.day && s.standId === stand.standId) {
        return false
      }
    }
  }

  return true
}

async function areAvailable(edition, stands, activities, venue, forConfirmation = false) {
  const confirmed = await Reservation.getConfirmedReservations(edition)
  let pending = !forConfirmation ? await Reservation.getPendingReservations(edition) : null

  if (venue.stands.length !== 0) { // If no stands in venue, "unlimited" stands per day
    for (let stand of stands) {
      if (forConfirmation) {
        if (!await isStandAvailable(confirmed, [], stand)) {
          return false
        }
      } else {
        if (!await isStandAvailable(confirmed, pending, stand)) {
          return false
        }
      }
    }
  }

  for (let activity of activities) {
    const kind = activity.kind
    const id = activity.id

    if (forConfirmation) {
      if (confirmed.map(res => {
        const act = res.activities.find(act => act.kind === kind)
        return act ? act.id : -1
      }).includes(id)) {
        return false
      }
    } else {
      if (confirmed.map(res => {
        const act = res.activities.find(act => act.kind === kind)
        return act ? act.id : -1
      }).includes(id) || pending.map(res => {
        const act = res.activities.find(act => act.kind === kind)
        return act ? act.id : -1
      }).includes(id)) {
        return false
      }
    }
  }

  return true
}

async function areValid(venue, stands, activities) {
  let ids = venue.getIds()

  if (venue.stands.length !== 0) { // If no stands, reservation only contains day
    for (let stand of stands) {
      if (!ids.includes(stand.standId)) {
        return false
      }
    }
  }

  for (let activity of activities) {
    if (!venue.getActivityIds(activity.kind).includes(activity.id)) { return false }
  }

  return true
}

async function companyReservations(companyId, edition, latest) {
  let filter = {
    companyId: companyId,
    edition: edition
  }
  return latest ? Reservation.getLatest(companyId, edition) : find(filter)
}

async function confirm(companyId, edition, member, venue) {
  let result = {
    data: null,
    error: null
  }

  let latest = await Reservation.getLatest(companyId, edition)

  if (latest === null) {
    result.error = 'No reservation found'
    return result
  }

  let available = await areAvailable(edition, latest.stands, latest.activities, venue, true)

  if (!available) {
    result.error = 'Stands are no longer available'
    return result
  }

  result.data = member ? await latest.confirm(member) : await latest.confirm(member)
  return result
}

async function cancel(companyId, edition, member) {
  let latest = await Reservation.getLatest(companyId, edition)

  if (latest === null) {
    return null
  }

  return member ? latest.cancel(member) : latest.cancel(member)
}

async function remove(companyId, edition, reservationId) {
  return Reservation.findOneAndRemove({
    companyId: companyId,
    edition: edition,
    id: reservationId
  })
}

async function getLatestReservations(edition, companyId) {
  if (companyId === undefined) {
    return Reservation.getAllLatest(edition)
  }

  let latest = await Reservation.getLatest(companyId, edition)
  return latest === null ? [] : [latest]
}

module.exports.arrayToJSON = arrayToJSON
module.exports.find = find
module.exports.findOne = findOne
module.exports.addStands = addStands
module.exports.canMakeReservation = canMakeReservation
module.exports.areConsecutive = areConsecutive
module.exports.areAvailable = areAvailable
module.exports.areValid = areValid
module.exports.getConfirmedReservations = Reservation.getConfirmedReservations
module.exports.getPendingReservations = Reservation.getPendingReservations
module.exports.companyReservations = companyReservations
module.exports.getLatestReservations = getLatestReservations
module.exports.confirm = confirm
module.exports.cancel = cancel
module.exports.remove = remove
