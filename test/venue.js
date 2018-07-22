const path = require('path')
const { before, after, afterEach, it, describe } = require('mocha')
const {expect} = require('chai')
const Venue = require(path.join('..', 'db', 'models', 'venue'))
const streamToPromise = require('stream-to-promise')
const FormData = require('form-data')
const fs = require('fs')
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server

describe('venue', function () {
  this.timeout(0)
  describe('upload image', async function () {
    let payload
    let headers

    before('getting a file', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js')))
      payload = await streamToPromise(form)
      headers = form.getHeaders()
    })

    it('should upload an image and create a new venue', async function () {
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

    it('should change an existing venue\'s image', async function () {
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

    it('should give an error if no payload is given', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`
      })

      expect(res.statusCode).to.eql(415)
    })

    it('should give an error if invalid payload format', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: { invalid: payload }
      })

      expect(res.statusCode).to.eql(400)
    })

    afterEach('cleaning up db', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })
  })
  describe('get venue', async function () {
    let venue1, venue2
    before('upload venue', async function () {
      let v1 = new Venue(mocks.VENUE1)
      let v2 = new Venue(mocks.VENUE2)

      venue1 = v1.toJSON()
      venue2 = v2.toJSON()

      await v1.save()
      await v2.save()
    })

    it('should get all venues', async function () {
      let res = await server.inject({
        method: 'GET',
        url: '/venue'
      })

      let venues = res.result

      expect(res.statusCode).to.eql(200)
      expect(venues).to.be.an('array')
      expect(venues.length).to.eql(2)
      expect(venues).to.deep.include(venue1)
      expect(venues).to.deep.include(venue2)
    })

    it('should get a specific venue', async function () {
      let res = await server.inject({
        method: 'GET',
        url: `/venue/${mocks.VENUE1.edition}`
      })

      let venue = res.result

      expect(res.statusCode).to.eql(200)
      expect(venue).to.eql(venue1)
    })

    it('should give an error if no specific venue found', async function () {
      let res = await server.inject({
        method: 'GET',
        url: `/venue/${mocks.VENUE1.edition}_`
      })

      expect(res.statusCode).to.eql(404)
    })

    after('cleaning up db', async function () {
      await Venue.collection.drop()
    })
  })
})
