const path = require('path')
const config = require(path.join(__dirname, '..', '..', 'config'))
const logger = require('logger').getLogger()
const fs = require('fs')
const handlebars = require('handlebars')

const API_KEY = config.MAILGUN.API_KEY
const DOMAIN = config.MAILGUN.DOMAIN
const HOST = config.MAILGUN.HOST

const mailgun = require('mailgun-js')({
  apiKey: API_KEY,
  domain: DOMAIN,
  host: HOST
})

let template
const filename = path.join(__dirname, 'email.html')

// eslint-disable-next-line security/detect-non-literal-fs-filename
fs.readFile(filename, { encoding: 'UTF-8' }, (err, data) => {
  if (err) {
    logger.error(err)
    process.exit(1)
  }

  template = handlebars.compile(data)
})

function send (receivers, templateData) {
  // receivers.push(config.COORDINATION_EMAIL)
  const venue = templateData.venue
  templateData.reservation.stands.map(stand => { stand.standId++; return stand })
  templateData.reservation.activities.map(act => {
    const activities = venue.activities.find(el => el.kind === act.kind)
    const slot = activities.slots.find(el => el.id === act.id)
    act.day = slot.day
    const start = new Date(slot.start)
    const end = new Date(slot.end)
    var shours = start.getUTCHours() < 10 ? '0' + start.getUTCHours() : start.getUTCHours()
    var sminutes = start.getUTCMinutes() < 10 ? '0' + start.getUTCMinutes() : start.getUTCMinutes()
    var ehours = end.getUTCHours() < 10 ? '0' + end.getUTCHours() : end.getUTCHours()
    var eminutes = end.getUTCMinutes() < 10 ? '0' + end.getUTCMinutes() : end.getUTCMinutes()
    act.start = shours + ':' + sminutes
    act.end = ehours + ':' + eminutes
    act.id++
    return act
  })
  templateData.reservation.issued = new Date(templateData.reservation.issued).toUTCString()

  receivers.forEach(receiver => {
    let data = {
      from: 'Mailgun <mailgun@sinfo.org>',
      to: receiver,
      subject: `[SINFO] ${templateData.link.companyName} stand reservation update`,
      html: template(templateData)
    }

    mailgun.messages().send(data, function (error, body) {
      if (error) { logger.error(error) }
    })
  })
}

function sendConfirmation (receivers, reservation, link, venue) {
  // if (process.env.NODE_ENV !== 'production') { return }

  let data = {
    state: 'CONFIRMED',
    reservation: reservation.data.toJSON(),
    link: link.toJSON(),
    venue: venue
  }

  send(receivers, data)
}

function sendCancellation (receivers, reservation, link, venue) {
  if (process.env.NODE_ENV !== 'production') { return }

  let data = {
    state: 'CANCELLED',
    reservation: reservation.toJSON(),
    link: link.toJSON(),
    venue: venue
  }

  send(receivers, data)
}

function sendNewReservation (receivers, reservation, link, venue) {
  if (process.env.NODE_ENV !== 'production') { return }

  let data = {
    state: 'PENDING',
    reservation: reservation.toJSON(),
    link: link.toJSON(),
    venue: venue
  }

  send(receivers, data)
}

module.exports = {
  name: 'mailgun',
  version: '1.0.0',
  register: async (server, options) => {
    server.method('mailgun.sendConfirmation', sendConfirmation)
    server.method('mailgun.sendCancellation', sendCancellation)
    server.method('mailgun.sendNewReservation', sendNewReservation)
  }
}
