const logger = require('logger').getLogger()
const Boom = require('boom')
const Joi = require('joi')
const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))

module.exports = [
  {
    // link?companyId=...&edition=...
    method: 'GET',
    path: '/link',
    config: {
      tags: ['api'],
      description: 'Gets a link or list of links',
      notes: 'based on the company id and/or edition and/or token in the query',
      handler: async (request, h) => {
        try {
          let link = await request.server.methods.link.find(request.query)
          let result = link.length !== undefined
            ? await request.server.methods.link.arrayToJSON(link)
            : link.toJSON()
          return result === null ? Boom.badData('No link associated') : result
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      validate: {
        query: {
          companyId: Joi.string().min(1)
            .max(30)
            .description('ID of company'),
          edition: Joi.string().min(1)
            .max(30)
            .description('Edition Number'),
          token: Joi.string()
            .description('Token')
        }
      },
      response: {
        schema: helpers.joi.links
      }
    }
  },
  {
    method: 'DELETE',
    path: '/link/company/{companyId}/edition/{edition}',
    config: {
      tags: ['api'],
      description: 'Removes a link from a company in a given edition',
      notes: 'Returns the removed link',
      handler: async (request, h) => {
        let companyId = request.params.companyId
        let edition = request.params.edition

        try {
          let link = await request.server.methods.link.delete(companyId, edition)
          return link === null ? Boom.badData('No link associated') : link.toJSON()
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      validate: {
        params: {
          companyId: Joi.string()
            .required().min(1).max(50)
            .description('Company identifier'),
          edition: Joi.string()
            .required().min(1).max(30)
            .description('Edition identifier')
        }
      },
      response: {
        schema: helpers.joi.link
      }
    }
  },
  {
    method: 'PUT',
    path: '/link/company/{company}/edition/{edition}',
    config: {
      tags: ['api'],
      description: 'Updates a link\'s information',
      notes: 'Returns the updated link',
      handler: async (request, h) => {
        let companyId = request.params.companyId
        let edition = request.params.edition
        let participationDays = request.payload.participationDays !== undefined
          ? request.payload.participationDays : 0
        let advertisementKind = request.payload.advertisementKind !== undefined
          ? request.payload.advertisementKind : 'none'

        try {
          let link = await request.server.methods.link.update(
            companyId, edition, participationDays, advertisementKind)
          return link === null ? Boom.badData('No link associated') : link.toJSON()
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      validate: {
        params: {
          companyId: Joi.string()
            .required().min(1).max(50)
            .description('Company identifier'),
          edition: Joi.string()
            .required().min(1).max(30)
            .description('Edition identifier')
        },
        payload: {
          participationDays: Joi.number().integer().min(1)
            .description('Number of days company is participating'),
          advertisementKind: Joi.string().min(1).max(20)
            .description('Type of package')
        }
      }
    }
  }
]
