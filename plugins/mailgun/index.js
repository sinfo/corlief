const path = require('path')
const config = require(path.join(__dirname, '..', '..', 'config'))
const logger = require('logger').getLogger()
const fs = require('fs')
const handlebars = require('handlebars')

const API_KEY = config.MAILGUN.API_KEY
const DOMAIN = config.MAILGUN.DOMAIN

const mailgun = require('mailgun-js')({
  apiKey: API_KEY,
  domain: DOMAIN
})

let template

fs.readFile(path.join(__dirname, 'email.html'), { encoding: 'UTF-8' }, (err, data) => {
  if (err) {
    logger.error(err)
    process.exit(1)
  }

  template = handlebars.compile(data)
})

function send (receivers, templateData) {
  receivers.push(config.COORDINATION_EMAIL)

  receivers.forEach(receiver => {
    let data = {
      from: 'Mailgun <mailgun@sinfo.org>',
      to: receiver,
      subject: '[SINFO] Stand reservation update',
      html: template(templateData)
    }

    mailgun.messages().send(data, function (error, body) {
      if (error) { logger.error(error) }
    })
  })
}

function sendConfirmation (receivers, reservation, link) {
  if (process.env.NODE_ENV !== 'production') { return }

  let data = {
    state: 'CONFIRMED',
    reservation: reservation,
    link: link
  }

  send(receivers, data)
}

function sendCancellation (receivers, reservation, link) {
  if (process.env.NODE_ENV !== 'production') { }

  let data = {
    state: 'CANCELLED',
    reservation: reservation,
    link: link
  }

  send(receivers, data)
}

function sendNewReservation (receivers, reservation, link) {
  if (process.env.NODE_ENV !== 'production') { return }

  let data = {
    state: 'PENDING',
    reservation: reservation,
    link: link
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
