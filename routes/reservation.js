
const logger = require('logger').getLogger()
const Boom = require('boom')
const Joi = require('joi')
const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))

module.exports = [
  {
    method: 'GET',
    path: '/reservation',
    config: {
      tags: ['api'],
      description: 'Gets a reservation or list of reservations',
      notes: 'Based on the company id and/or edition in the query',
      validate: {
        query: {
          companyId: Joi.string().min(1)
            .max(30)
            .description('ID of company'),
          edition: Joi.string().min(1)
            .max(30)
            .description('Edition Number')
        }
      },
      handler: async (request, h) => {
        try {
          const reservation = await request.server.methods.reservation.find(request.query)

          const result = (reservation.length !== undefined)
            ? await request.server.methods.reservation.arrayToJSON(reservation)
            : reservation.toJSON()
          return result === null ? Boom.badData('No reservation associated') : result
        } catch (err) {
          logger.error(err.message)
          return Boom.boomify(err)
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/reservation/latest',
    config: {
      tags: ['api'],
      description: 'Gets a reservation or list of reservations',
      notes: 'Based on the company id and/or edition in the query',
      pre: [
        helpers.pre.edition
      ],
      validate: {
        query: {
          companyId: Joi.string().min(1)
            .max(30)
            .description('ID of company')
        }
      },
      handler: async (request, h) => {
        try {
          const edition = request.pre.edition
          const companyId = request.query.companyId

          const reservations = await request.server.methods.reservation.getLatestReservations(edition, companyId)
          return request.server.methods.reservation.arrayToJSON(reservations)
        } catch (err) {
          logger.error(err.message)
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.reservations
      }
    }
  },
  {
    method: 'GET',
    path: '/reservation/company/{companyId}/confirm',
    config: {
      tags: ['api'],
      description: 'Confirm latest company\'s reservation',
      pre: [
        helpers.pre.edition
      ],
      validate: {
        params: Joi.object({
          companyId: Joi.string().required()
            .min(1).max(50)
            .description('Company identifier')
        })
      },
      handler: async (request, h) => {
        try {
          const companyId = request.params.companyId
          const edition = request.pre.edition

          const reservation = await request.server.methods.reservation.confirm(companyId, edition)

          return reservation.data === null ? Boom.badData(reservation.error) : reservation.data.toJSON()
        } catch (err) {
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.reservation
      }
    }
  },
  {
    method: 'DELETE',
    path: '/reservation/company/{companyId}',
    config: {
      tags: ['api'],
      description: 'Cancel latest company\'s reservation',
      pre: [
        helpers.pre.edition
      ],
      validate: {
        params: Joi.object({
          companyId: Joi.string().required()
            .min(1).max(50)
            .description('Company identifier')
        })
      },
      handler: async (request, h) => {
        try {
          const companyId = request.params.companyId
          const edition = request.pre.edition

          const reservation = await request.server.methods.reservation.cancel(companyId, edition)

          return reservation === null ? Boom.badData('No reservation found') : reservation.toJSON()
        } catch (err) {
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.reservation
      }
    }
  }
]