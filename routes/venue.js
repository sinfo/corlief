const logger = require('logger').getLogger()
const Boom = require('boom')
const Joi = require('joi')

module.exports = [
  {
    method: 'GET',
    path: '/venue',
    config: {
      tags: ['api'],
      description: 'Gets a venue or all editions\' venues',
      notes: 'based on the edition and/or token in the query',
      handler: async (request, h) => {
        try {
          let venue = await request.server.methods.venue.find(request.query)
          return venue === null ? Boom.notFound('No venue associated') : venue
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      validate: {
        query: {
          edition: Joi.string().min(1)
            .max(30)
            .description('Edition Number')
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/venue/image',
    config: {
      tags: ['api'],
      description: 'Uploads a venue\'s image to the latest edition',
      handler: async (request, h) => {
        try {
          let edition = await request.server.methods.deck.getLatestEdition()

          let file = request.payload.file
          let imageLocation = await request.server.methods.files.venue.upload(file, 'venue.png', edition.id)

          if (imageLocation === null) {
            return Boom.expectationFailed('Could not upload image')
          }

          let venue = await request.server.methods.venue.find({ edition: edition.id })

          if (venue === null || venue === []) {
            venue = await request.server.methods.venue.create(edition.id)
          }

          let updatedVenue = await request.server.methods.venue.updateImage(edition.id, imageLocation)

          return updatedVenue === null ? Boom.badData('Invalid data for the venue') : updatedVenue
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form'
        }
      },
      validate: {
        payload: {
          file: Joi.any()
            .meta({ swaggerType: 'file' })
            .required()
            .description('image file')
        }
      },
      payload: {
        maxBytes: 1024 * 1024 * 100, // 100MB
        parse: true,
        output: 'data',
        allow: 'multipart/form-data'
      }
    }
  }
]
