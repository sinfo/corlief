const Joi = require('joi')
const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))
const Boom = require('boom')

module.exports = [
  {
    method: 'GET',
    path: '/company/auth',
    config: {
      auth: 'company',
      tags: ['api'],
      description: 'Check token validation',
      handler: async (request, h) => {
        return request.auth.credentials
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
          return venue.getStandsAvailability(confirmedReservation, duration)
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
          helpers.pre.config,
          helpers.pre.venue
        ]
      ],
      handler: async (request, h) => {
        let companyId = request.auth.credentials.company
        let stands = request.payload
        let edition = request.pre.edition
        let link = request.pre.link
        // let config = request.pre.config
        let venue = request.pre.venue

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

          let canMakeReservation = await request.server.methods.reservation.canMakeReservation(companyId, edition)

          if (!canMakeReservation.result) {
            return Boom.locked(canMakeReservation.error)
          }

          let areValid = await request.server.methods.reservation.areValid(venue, stands)

          if (!areValid) {
            return Boom.badData('Stand(s) not registered in venue')
          }

          let areAvailable = await request.server.methods.reservation.areAvailable(edition, stands)

          if (!areAvailable) {
            return Boom.conflict('Stand(s) not available', stands)
          }

          // TODO
          /*
          let consecutiveDaysReservations = config.consecutive_days_reservations
          let areConsecutive = await request.server.methods.reservation.areConsecutive(stands)
          if (consecutiveDaysReservations && !areConsecutive) {
            return Boom.badData('Must be consecutive days in the same stand')
          }
          */

          let reservation = await request.server.methods.reservation.addStands(companyId, edition, stands)

          return reservation.toJSON()
        } catch (err) {
          console.error(err)
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

          let response = await request.server.methods.reservation.cancelReservation(companyId, edition)

          if (response.error !== null) {
            return Boom.locked(response.error)
          }

          return response.reservation.toJSON()
        } catch (err) {
          console.error(err)
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
  }
]
