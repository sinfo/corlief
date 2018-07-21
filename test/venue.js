const path = require('path')
const { before, afterEach, it, describe } = require('mocha')
const {expect} = require('chai')
const Venue = require(path.join('..', 'db', 'models', 'venue'))
const streamToPromise = require('stream-to-promise')
const FormData = require('form-data')
const fs = require('fs')
const server = require(path.join(__dirname, '..', 'app')).server

describe('venue', function () {
  describe('upload image', async function () {
    let payload
    let headers

    before('getting a file', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js')))
      payload = await streamToPromise(form)
      headers = form.getHeaders()
    })

    it('should be able to upload an image and create a new venue', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      let venue = res.result
      let venueFromDB = await Venue.findOne({ edition: venue.edition })

      expect(res.statusCode).to.eql(200)

      expect(venueFromDB).to.not.be.null
      expect(venueFromDB.edition).to.eql(venue.edition)
      expect(venueFromDB.image).to.eql(venue.image)
    })

    it('should be able to change an existing venue\'s image', async function () {
      this.timeout(0)
      let imageUrl = 'https://yes.anotherImage.png'

      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      let venue = res1.result

      let oldVenue = await Venue.findOneAndUpdate(
        {
          edition: venue.edition
        },
        {
          $set: {
            image: imageUrl
          }
        },
        {
          new: true
        }
      )

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res2.result
      let newVenue = await Venue.findOne({ edition: venue.edition })

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)

      expect(newVenue).to.not.be.null
      expect(newVenue.edition).to.eql(venue.edition)
      expect(newVenue.image).to.eql(venue.image)
      expect(newVenue.image).to.not.eql(oldVenue.image)
    })

    afterEach('cleaning up db', async function () {
      await Venue.collection.drop()
    })
  })
})
