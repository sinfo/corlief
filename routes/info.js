
const logger = require('logger').getLogger()
const Boom = require('boom')
const Joi = require('joi')
const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))

module.exports = [
  {
    method: 'GET',
    path: '/info',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Gets a specific company\'s info',
      notes: 'Based on the company id and/or edition in the query',
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
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
          const info = await request.server.methods.info.find(request.query)

          return info === undefined ? 
          Boom.badData(`No info found for ${companyId}`) : 
          request.server.methods.info.arrayToJSON(info)
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/info/company/{companyId}/confirm',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Confirm company\'s info',
      pre: [
        [
          helpers.pre.edition
        ]
      ],
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
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
          const member = request.auth.credentials.user

          const info = await request.server.methods.info.confirm(companyId, edition, member)
          return info.data === null ? Boom.badData(info.error) : info.data.toJSON()
        } catch (err) {
          return Boom.boomify(err)
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/info/company/{companyId}/cancel',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Cancel company\'s info',
      pre: [
        [
          helpers.pre.edition
        ]
      ],
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
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
          const member = request.auth.credentials.user

          const info = await request.server.methods.info.cancel(companyId, edition, member)
          return info.data === null ? Boom.badData(info.error) : info.data.toJSON()
        } catch (err) {
          return Boom.boomify(err)
        }
      }
    }
  }
]
