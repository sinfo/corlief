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
    method: 'POST',
    path: '/link',
    config: {
      tags: ['api'],
      description: 'Creates a company link',
      notes: 'Returns the created link',
      pre: [
        [
          helpers.pre.edition,
          helpers.pre.isCompanyValid
        ],
        helpers.pre.token
      ],
      validate: {
        payload: {
          companyId: Joi.string()
            .required().min(1).max(50)
            .description('Company identifier'),
          participationDays: Joi.number()
            .required().min(1).max(5)
            .description('Amount of days company will participate in edition'),
          advertisementKind: Joi.string()
            .required().min(1).max(10)
            .description('Company advertisement package in edition'),
          activities: Joi.array()
            .items(Joi.object({
              kind: Joi.string()
                .min(1).max(30)
                .description('Type of activity'),
              date: Joi.date()
                .description('Date of realization of such activity')
            })),
          expirationDate: Joi.date()
            .required().min(new Date())
            .description('Date of link expiration')
        }
      },
      handler: async (request, h) => {
        try {
          const { companyId, participationDays, advertisementKind, activities } = request.payload
          const { edition, token, isCompanyValid } = request.pre

          if (isCompanyValid === false) {
            return Boom.badData('CompanyId does not exist')
          }

          let link = await request.server.methods.link.create(
            companyId, edition, token, participationDays, activities, advertisementKind)

          return link === null ? Boom.badData('No link associated') : link.toJSON()
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.link
      }
    }
  },
  {
    method: 'GET',
    path: '/link/company/{companyId}/edition/{edition}',
    config: {
      tags: ['api'],
      description: 'Revokes a link',
      notes: 'Changes valid field to false',
      handler: async (request, h) => {
        try {
          let company = request.params.companyId
          let edition = request.params.edition

          let link = await request.server.methods.link.revoke(company, edition)
          return link === null ? Boom.badData('No link associated') : link.toJSON()
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      validate: {
        params: {
          companyId: Joi.string().required().min(1)
            .max(30)
            .description('company identifier'),
          edition: Joi.string().required().min(1)
            .max(30)
            .description('edition identifier')
        }
      },
      response: {
        schema: helpers.joi.links
      }
    }
  }
]
