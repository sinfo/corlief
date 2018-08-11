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
    method: 'POST',
    path: '/company/reservation',
    config: {
      auth: 'company',
      tags: ['api'],
      description: 'Make reservation',
      pre: [
        helpers.pre.edition,
        helpers.pre.link
      ],
      handler: async (request, h) => {
        let companyId = request.auth.credentials.company
        let stands = request.payload
        let edition = request.pre.edition
        let link = request.pre.link

        try {
          for (let stand of stands) {
            if (!await request.server.methods.reservation.isStandAvailable(companyId, edition, stand)) {
              return Boom.conflict('Stand not available', stand)
            }
          }

          let isConfirmed = await request.server.methods.reservation.isConfirmed(companyId, edition)

          if (isConfirmed.result) {
            return Boom.locked(isConfirmed.error)
          }

          let latest = await request.server.methods.reservation.getLatest(companyId, edition)

          if (latest.stands.length >= link.participationDays) {
            return Boom.entityTooLarge('Cannot reserve any more stands')
          }

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
  }
]
