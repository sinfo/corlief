const Joi = require('joi')
const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))
const Boom = require('boom')
const logger = require('logger').getLogger()
const config = require('../config')

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
            companyName: link[0].companyName,
            activities: link[0].activities
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
        let activities = request.payload.activities

        try {
          if (venue === null) {
            logger.error('No venue created')
            return Boom.forbidden('No venue created')
          }

          if (stands.length !== link.participationDays) {
            logger.error('Wrong ammount of stands in reservation')
            return Boom.badData('Wrong ammount of stands in reservation', {
              stands: stands.length,
              participationDays: link.participationDays
            })
          }

          const activitiesKind = activities.map(a => a.kind)
          let eq = activitiesKind.length === link.activities.length
          activitiesKind.forEach(element => {
            eq = eq && link.activities.includes(element)
          })
          if (!eq) {
            logger.error({ activitiesKind: activitiesKind, activities: link.activities }, 'Activities in reservation do not match activities in link')
            return Boom.badData('Activities in reservation do not match activities in link')
          }

          let canMakeReservation = await request.server.methods.reservation
            .canMakeReservation(companyId, edition)

          if (!canMakeReservation.result) {
            logger.error('locked')
            return Boom.locked(canMakeReservation.error)
          }

          let areValid = await request.server.methods.reservation.areValid(venue, stands, activities)

          if (!areValid) {
            logger.error('Stand(s) not registered in venue')
            return Boom.badData('Stand(s) not registered in venue')
          }

          let areAvailable = await request.server.methods.reservation.areAvailable(edition, stands, activities, venue)

          if (!areAvailable) {
            logger.error('Conflicting reservation: Something not available')
            return Boom.conflict('Conflicting reservation: Something not available', { stands: stands, activities: activities })
          }

          // TODO:
          /*
          let consecutiveDaysReservations = config.consecutive_days_reservations
          let areConsecutive = await request.server.methods.reservation.areConsecutive(stands)
          if (consecutiveDaysReservations && !areConsecutive) {
            return Boom.badData('Must be consecutive days in the same stand')
          }
          */

          let reservation = await request.server.methods.reservation
            .addStands(companyId, edition, stands, activities)

          const receivers = link.contacts.company
            ? [link.contacts.member, link.contacts.company]
            : [link.contacts.member]

          request.server.methods.mailgun.sendNewReservation(receivers, reservation, link, venue)

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
    method: 'POST',
    path: '/company/contract',
    config: {
      auth: 'company',
      tags: ['api'],
      description: 'Submit signed contract',
      pre: [
        [
          helpers.pre.edition,
          helpers.pre.contract
        ]
      ],
      handler: async (request, h) => {
        const companyId = request.auth.credentials.company
        const edition = request.pre.edition
        const file = request.pre.contract

        if (config.SUBMISSIONS.CONTRACTS) {
          const feedback = await request.server.methods.contract.isContractAccepted(companyId, edition)
          if (feedback.result == null) {
            let contractLocation = await request.server.methods.files.contracts.upload(
              file.data,
              `contract_${companyId}_${edition}${file.extension}`,
              edition,
              companyId)
    
            logger.info(contractLocation)
            if (contractLocation === null) {
              return Boom.expectationFailed('Could not upload signed contract for ' + companyId)
            }
          } else if (!feedback.result) {
            logger.error('Contract is pending review')
            return Boom.locked(feedback.error)
          } else {
            logger.info(`A contract was already submitted for ${companyId} for ${edition} edition`)
            return Boom.locked(feedback.error)
          }
        }
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
          logger.error({ info: request.info, error: err })
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
