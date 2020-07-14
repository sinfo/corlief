const Joi = require('joi')
const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))
const Boom = require('boom')
const logger = require('logger').getLogger()

module.exports = [
  {
    method: 'GET',
    path: '/company/auth',
    config: {
      auth: 'company',
      tags: ['api'],
      description: 'Check token validation',
      handler: async (request, h) => {
        try {
          const credentials = request.auth.credentials

          const link = await request.server.methods.link.find({
            companyId: credentials.company,
            edition: credentials.edition
          })

          let response = {}

          Object.assign(response, credentials, {
            participationDays: link[0].participationDays,
            companyName: link[0].companyName
          })

          return response
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.unauthorized(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown()
      },
      response: {
        schema: helpers.joi.credentials
      }
    }
  },
  {
    method: 'GET',
    path: '/company/venue',
    config: {
      auth: 'company',
      tags: ['api'],
      description: 'Get current venue\'s stands\' availability',
      pre: [
        [
          helpers.pre.edition,
          helpers.pre.duration
        ],
        [
          helpers.pre.venue
        ]
      ],
      handler: async (request, h) => {
        const edition = request.pre.edition
        const duration = request.pre.duration
        const venue = request.pre.venue

        try {
          if (venue === null) {
            return Boom.badData('No venue is associated with this edition')
          }

          let confirmedReservation = await request.server.methods.reservation.getConfirmedReservations(edition)
          let pendingReservation = await request.server.methods.reservation.getPendingReservations(edition)
          return venue.getStandsAvailability(confirmedReservation, pendingReservation, duration)
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown()
      },
      response: {
        schema: helpers.joi.venueAvailability
      }
    }
  },
  {
    method: 'POST',
    path: '/company/reservation',
    config: {
      auth: 'company',
      tags: ['api'],
      description: 'Make reservation',
      pre: [
        [
          helpers.pre.edition,
          helpers.pre.link
        ],
        [
          helpers.pre.venue
        ]
      ],
      handler: async (request, h) => {
        let companyId = request.auth.credentials.company
        let stands = request.payload.stands
        let edition = request.pre.edition
        let link = request.pre.link
        let venue = request.pre.venue
        let workshop = request.payload.workshop
        let presentation = request.payload.presentation

        try {
          if (venue === null) {
            return Boom.forbidden('No venue created')
          }

          if (stands.length !== link.participationDays) {
            return Boom.badData('Wrong ammount of stands in reservation', {
              stands: stands.length,
              participationDays: link.participationDays
            })
          }

          // Note: Workshop and Presentation can be 0 and valid. Only null and undef are considered invalid
          if (link.workshop == null && workshop != null) {
            return Boom.badData('Not entitled to workshop')
          }
          if (link.presentation == null && presentation != null) {
            return Boom.badData('Not entitled to presentation')
          }
          if (link.workshop != null && workshop == null) {
            return Boom.badData('Workshop reservation missing')
          }
          if (link.presentation != null && presentation == null) {
            return Boom.badData('Presentation reservation missing')
          }

          let canMakeReservation = await request.server.methods.reservation
            .canMakeReservation(companyId, edition)

          if (!canMakeReservation.result) {
            return Boom.locked(canMakeReservation.error)
          }

          let areValid = await request.server.methods.reservation.areValid(venue, stands, workshop, presentation)

          if (!areValid) {
            return Boom.badData('Stand(s) not registered in venue')
          }

          let areAvailable = await request.server.methods.reservation.areAvailable(edition, stands, workshop, presentation)

          if (!areAvailable) {
            return Boom.conflict('Conflicting reservation: Something not available', { stands: stands, workshop: workshop, presentation: presentation })
          }

          // TODO
          /*
          let consecutiveDaysReservations = config.consecutive_days_reservations
          let areConsecutive = await request.server.methods.reservation.areConsecutive(stands)
          if (consecutiveDaysReservations && !areConsecutive) {
            return Boom.badData('Must be consecutive days in the same stand')
          }
          */

          let reservation = await request.server.methods.reservation
            .addStands(companyId, edition, stands, workshop, presentation)

          const receivers = link.contacts.company
            ? [link.contacts.member, link.contacts.company]
            : [link.contacts.member]

          request.server.methods.mailgun.sendNewReservation(receivers, reservation, link)

          return reservation.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        payload: helpers.joi.standsReservation
      },
      response: {
        schema: helpers.joi.reservation
      }
    }
  },
  {
    method: 'DELETE',
    path: '/company/reservation',
    config: {
      auth: 'company',
      tags: ['api'],
      description: 'Cancel company reservation',
      pre: [
        [
          helpers.pre.edition,
          helpers.pre.link
        ],
        [
          helpers.pre.config,
          helpers.pre.venue
        ]
      ],
      handler: async (request, h) => {
        let companyId = request.auth.credentials.company
        let edition = request.pre.edition
        let venue = request.pre.venue

        try {
          if (venue === null) {
            return Boom.forbidden('No venue created')
          }

          const reservation = await request.server.methods.reservation.cancel(companyId, edition)

          return reservation === null ? Boom.badData('No reservation found') : reservation.toJSON()
        } catch (err) {
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown()
      },
      response: {
        schema: helpers.joi.reservation
      }
    }
  },
  {
    method: 'GET',
    path: '/company/reservation',
    config: {
      auth: 'company',
      tags: ['api'],
      description: 'Gets all reservations associated with company',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          const companyId = request.auth.credentials.company
          const edition = request.pre.edition
          const latest = request.query.latest

          let reservation = await request.server.methods.reservation.companyReservations(companyId, edition, latest)
          if (reservation === null) {
            return []
          }
          return reservation.length === undefined ? [reservation.toJSON()] : request.server.methods.reservation.arrayToJSON(reservation)
        } catch (err) {
          console.error(err)
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        query: {
          latest: Joi.boolean().required().description('Defines if only one or all')
        }
      },
      response: {
        schema: helpers.joi.reservations
      }
    }
  }
]
