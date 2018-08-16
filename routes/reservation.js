
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
          logger.error(err)
          return Boom.boomify(err)
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
      validate: {
        params: Joi.object({
          companyId: Joi.string().required()
            .min(1).max(50)
            .description('Company identifier')
        })
      },
      response: {
        schema: helpers.joi.reservation
      }
    }
  }
]
