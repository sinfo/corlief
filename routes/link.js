const logger = require('logger').getLogger()
const Boom = require('boom')
const Joi = require('joi')
const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))
const validator = require('email-validator')

module.exports = [
  {
    method: 'GET',
    path: '/link',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Gets a link or list of links',
      notes: 'Based on the company id and/or edition and/or token in the query',
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
            .description('Edition Number'),
          token: Joi.string()
            .description('Token')
        }
      },
      handler: async (request, h) => {
        try {
          const link = await request.server.methods.link.find(request.query)

          const result = (link.length !== undefined)
            ? await request.server.methods.link.arrayToJSON(link)
            : link.toJSON()
          return result === null ? Boom.badData('No link associated') : result
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.links
      }
    }
  },
  {
    method: 'GET',
    path: '/link/validity',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Checks the validity of all still supposedly valid links',
      notes: 'Returns all the current editions\'s links',
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown()
      },
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          const edition = request.pre.edition
          const links = await request.server.methods.link.find({ valid: true })

          for (const link of links) {
            const token = await request.server.methods.jwt.verify(link.token)

            if (token === null || token.exp * 1000 - new Date().getTime() <= 0) {
              await request.server.methods.link.revoke(link.companyId, link.edition)
            }
          }

          const result = await request.server.methods.link.find({ edition: edition })
          return await request.server.methods.link.arrayToJSON(result)
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.links
      }
    }
  },
  {
    method: 'GET',
    path: '/link/company/{companyId}/validity',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Checks the validity of a link from a company in a given edition',
      notes: 'Returns the corresponding expirationDate',
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        params: {
          companyId: Joi.string()
            .required().min(1).max(50)
            .description('Company identifier')
        }
      },
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          const edition = request.pre.edition
          const companyId = request.params.companyId
          const link = await request.server.methods.link.find(
            { edition: edition, companyId: companyId }
          )

          if (!link.length) {
            return Boom.badData('Link not found')
          }

          if (!link[0].valid) {
            return Boom.resourceGone('Link not valid')
          }

          const token = await request.server.methods.jwt.verify(link[0].token)

          if (token && token.exp * 1000 - new Date().getTime() <= 0) {
            await request.server.methods.link.revoke(companyId, edition)
            return Boom.resourceGone('Token expired')
          }

          return token === null
            ? Boom.resourceGone('Token expired')
            : { expirationDate: new Date(token.exp * 1000).toJSON() }
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.expirationDate
      }
    }
  },
  {
    method: 'GET',
    path: '/link/missing',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Get all companies that have no link for the current event',
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown()
      },
      pre: [
        [helpers.pre.edition],
        [helpers.pre.companies]
      ],
      handler: async (request, h) => {
        try {
          return request.pre.companies
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.companies
      }
    }
  },
  {
    method: 'DELETE',
    path: '/link/company/{companyId}/edition/{edition}',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Removes a link from a company in a given edition',
      notes: 'Returns the removed link',
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        params: {
          companyId: Joi.string()
            .required().min(1).max(50)
            .description('Company identifier'),
          edition: Joi.string()
            .required().min(1).max(30)
            .description('Edition identifier')
        }
      },
      handler: async (request, h) => {
        const { companyId, edition } = request.params

        try {
          const link = await request.server.methods.link.delete(companyId, edition)
          return link === null ? Boom.badData('No link associated') : link.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.link
      }
    }
  },
  {
    method: 'PUT',
    path: '/link/company/{companyId}/edition/{edition}',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Updates a link\'s information',
      notes: 'Returns the updated link',
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        params: {
          companyId: Joi.string().required().min(1).max(50)
            .description('Company identifier'),
          edition: Joi.string().required().min(1).max(30)
            .description('Edition identifier')
        },
        payload: {
          participationDays: Joi.number().integer().min(1).max(5)
            .description('Number of days company is participanting'),
          advertisementKind: Joi.string().min(1).max(100)
            .description('Type of package'),
          companyContact: Joi.string().min(1).max(100)
            .description('Company contact'),
          memberContact: Joi.string().min(1).max(100)
            .description('Member contact')

        }
      },
      handler: async (request, h) => {
        try {
          let companyId = request.params.companyId
          let edition = request.params.edition
          let participationDays = request.payload.participationDays
          let advertisementKind = request.payload.advertisementKind
          let companyContact = request.payload.companyContact
          let memberContact = request.payload.memberContact

          let link = await request.server.methods.link.update(
            companyId, edition, participationDays, advertisementKind, companyContact, memberContact
          )

          return link === null ? Boom.badData('no link associated') : link.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
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
      auth: 'sinfo',
      tags: ['api'],
      description: 'Creates a company link',
      notes: 'Returns the created link',
      pre: [
        [
          helpers.pre.edition,
          helpers.pre.isCompanyValid
        ],
        [
          helpers.pre.company,
          helpers.pre.member,
          helpers.pre.token
        ]
      ],
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        payload: helpers.joi.linkPayload
      },
      handler: async (request, h) => {
        try {
          const { companyId, companyEmail, participationDays, advertisementKind, activities, workshop, presentation } = request.payload
          const { edition, isCompanyValid, token, company, member } = request.pre

          if (isCompanyValid === false) {
            return Boom.badData('CompanyId does not exist')
          }

          if (!validator.validate(companyEmail)) {
            return Boom.badData('Invalid email')
          }

          if (member.mails.main === undefined) {
            return Boom.badData('The member (SINFO Organizer) doesn\'t have his/her main email setup. This email should be something like john.doe@sinfo.org')
          }

          let link = await request.server.methods.link.create(
            companyId, company.name, edition,
            member.mails.main, token, participationDays,
            activities, advertisementKind, companyEmail
          )

          return link === null ? Boom.badData('No link associated') : link.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
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
    path: '/link/company/{companyId}/edition/{edition}/revoke',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Revokes a link',
      notes: 'Returns the same link with the valid field changed to false',
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        params: {
          companyId: Joi.string()
            .required().min(1).max(50)
            .description('Company identifier'),
          edition: Joi.string()
            .required().min(1).max(30)
            .description('Edition identifier')
        }
      },
      handler: async (request, h) => {
        try {
          const { companyId, edition } = request.params
          const link = await request.server.methods.link.revoke(companyId, edition)
          return link === null ? Boom.badData('No link associated') : link.toJSON()
        } catch (err) {
          console.error(err)
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.joi.link
      }
    }
  },
  {
    method: 'PUT',
    path: '/link/company/{companyId}/edition/{edition}/extend',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Extends the validy of the token for the given company for the given edition',
      notes: 'Returns the new link with a new token if inputs inputs are valid',
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        params: {
          companyId: Joi.string()
            .required().min(1).max(50)
            .description('Company identifier'),
          edition: Joi.string()
            .required().min(1).max(30)
            .description('Edition identifier')
        },
        payload: {
          expirationDate: Joi.date()
            .required().min(new Date())
            .description('Date of link expiration')
        }
      },
      handler: async (request, h) => {
        const { companyId, edition } = request.params
        const { expirationDate } = request.payload

        try {
          const token = await request.server.methods.jwt.generate(edition, companyId, expirationDate)
          const link = await request.server.methods.link.setToken(request.params, token)
          return (link) ? link.toJSON() : Boom.badData('No link associated')
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      }
    }
  }
]
