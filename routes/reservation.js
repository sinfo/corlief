const Joi = require('joi')
const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))
const Boom = require('boom')

module.exports = [
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
