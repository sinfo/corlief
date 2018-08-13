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
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename
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

  describe('add stand to venue', async function () {
    let venue

    before('create venue with image', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res.result
    })

    it('should add a new stand', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND1
      })

      let result = res.result

      expect(res.statusCode).to.eql(200)
      expect(result.stands.length).to.eql(1)
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND1, { id: 0 }))
    })

    it('should add another stand with incremented id', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND1
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2
      })

      let result = res2.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(result.stands.length).to.eql(2)
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND1, { id: 0 }))
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND2, { id: 1 }))
    })

    it('should add a stand with id corresponding to the lowest number available', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND1
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND3
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.stands = v.stands.filter(stand => stand.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND4
      })

      let result = res4.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(result.stands.length).to.eql(3)
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND1, { id: 0 }))
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND3, { id: 2 }))
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND4, { id: 1 }))
    })

    it('should give an error if topleft.x > bottomRight.x', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: {
          topLeft: {
            x: 1,
            y: 1
          },
          bottomRight: {
            x: 0,
            y: 0
          }
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    it('should give an error if topLeft.y < bottomRight.y', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: {
          topLeft: {
            x: 1,
            y: 1
          },
          bottomRight: {
            x: 2,
            y: 2
          }
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      await Venue.collection.drop()
    })

    afterEach('delete stands from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { stands: [] } }
      )
    })
  })

  describe('delete a stand in venue', async function () {
    let venue

    before('create venue with image', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js')))

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res.result
    })

    it('should add a series of stands and try to remove the one with id 3 (which doesn\'t exist)', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND1
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND3
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.stands = v.stands.filter(stand => stand.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND4
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/stand/3`
      })

      let result = res4.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(422)
      expect(result.stands.length).to.eql(3)
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND1, { id: 0 }))
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND3, { id: 2 }))
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND4, { id: 1 }))
    })

    it('should add a series of stands and remove the one with id 1', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND1
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND3
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.stands = v.stands.filter(stand => stand.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND4
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/stand/1`
      })

      let result = res5.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)
      expect(result.stands.length).to.eql(2)
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND1, { id: 0 }))
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND3, { id: 2 }))
    })

    after('cleaning up venues', async function () {
      await Venue.collection.drop()
    })

    afterEach('delete stands from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { stands: [] } }
      )
    })
  })

  describe('replace stands in venue', async function () {
    let venue

    before('create venue with image and add a stand', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      let res = await server.inject({
        method: 'POST',
        url: '/venue/stand',
        headers: headers,
        payload: mocks.STAND1
      })

      venue = res.result
    })

    it('should replace the stand with the new stands', async function () {
      let stands = [
        mocks.STAND1,
        mocks.STAND2,
        mocks.STAND3,
        mocks.STAND4
      ]

      let res = await server.inject({
        method: 'PUT',
        url: '/venue/stand',
        payload: stands
      })

      let result = res.result

      expect(res.statusCode).to.eql(200)
      expect(result.stands.length).to.eql(4)

      expect(result.stands.map(stand => {
        delete stand.id
        return stand
      })).to.eql(stands)
    })

    it('should give an error if one of the stands has topleft.x > bottomRight.x', async function () {
      let stands = [
        mocks.STAND1,
        {
          topLeft: {
            x: 1,
            y: 1
          },
          bottomRight: {
            x: 0,
            y: 0
          }
        },
        mocks.STAND2
      ]

      let res = await server.inject({
        method: 'PUT',
        url: `/venue/stand`,
        payload: stands
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      await Venue.collection.drop()
    })

    afterEach('delete stands from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { stands: [] } }
      )
    })
  })
})
