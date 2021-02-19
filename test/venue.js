/* eslint-disable no-unused-expressions */

const path = require('path')
const { before, after, afterEach, it, describe } = require('mocha')
const { expect } = require('chai')
const Venue = require(path.join('..', 'db', 'models', 'venue'))
const streamToPromise = require('stream-to-promise')
const FormData = require('form-data')
const fs = require('fs')
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server
const helpers = require('./helpers')

let sinfoCredentials

before('getting sinfo auth', async function () {
  sinfoCredentials = await helpers.sinfoCredentials()
})

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
      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })
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
        url: `/venue/image`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
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
        url: '/venue',
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
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
        url: `/venue/${mocks.VENUE1.edition}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let venue = res.result

      expect(res.statusCode).to.eql(200)
      expect(venue).to.eql(venue1)
    })

    it('should give an error if no specific venue found', async function () {
      let res = await server.inject({
        method: 'GET',
        url: `/venue/${mocks.VENUE1.edition}_`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(404)
    })

    after('cleaning up db', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })
  })

  describe('add stand to venue', async function () {
    let venue

    before('create venue with image', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

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
        payload: mocks.STAND1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
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
        payload: mocks.STAND1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
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
        payload: mocks.STAND1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.stands = v.stands.filter(stand => stand.id !== 0 && stand.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND5,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res5.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)

      expect(result.stands.length).to.eql(3)
      expect(result.stands[0]).to.deep.eql(Object.assign({}, mocks.STAND3, { id: 2 }))
      expect(result.stands[1]).to.deep.eql(Object.assign({}, mocks.STAND4, { id: 0 }))
      expect(result.stands[2]).to.deep.eql(Object.assign({}, mocks.STAND5, { id: 1 }))
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
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
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
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
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
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

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
        payload: mocks.STAND1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.stands = v.stands.filter(stand => stand.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/stand/3`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
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
        payload: mocks.STAND1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.stands = v.stands.filter(stand => stand.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/stand/1`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
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
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
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

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

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
        payload: stands,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
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
        payload: stands,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete stands from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { stands: [] } }
      )
    })
  })

  describe('add workshop to venue', async function () {
    let venue

    before('create venue with image', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res.result
    })

    it('should add a new workshop', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res.result

      expect(res.statusCode).to.eql(200)
      expect(result.workshops.length).to.eql(1)
      expect(result.workshops).to.deep.include(Object.assign({}, mocks.ACTIVITY1, { id: 0 }))
    })

    it('should add another workshop with incremented id', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res2.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(result.workshops.length).to.eql(2)
      expect(result.workshops).to.deep.include(Object.assign({}, mocks.ACTIVITY1, { id: 0 }))
      expect(result.workshops).to.deep.include(Object.assign({}, mocks.ACTIVITY2, { id: 1 }))
    })

    it('should add a workshop with id corresponding to the lowest number available', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.workshops = v.workshops.filter(ws => ws.id !== 0 && ws.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY5,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res5.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)

      expect(result.workshops.length).to.eql(3)
      expect(result.workshops[0]).to.deep.eql(Object.assign({}, mocks.ACTIVITY3, { id: 2 }))
      expect(result.workshops[1]).to.deep.eql(Object.assign({}, mocks.ACTIVITY4, { id: 0 }))
      expect(result.workshops[2]).to.deep.eql(Object.assign({}, mocks.ACTIVITY5, { id: 1 }))
    })

    it('should give an error if start >= end', async function () {
      let date = new Date()
      let res = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: {
          day: 1,
          start: date,
          end: date
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete workshops from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { workshops: [] } }
      )
    })
  })

  describe('delete a workshop in venue', async function () {
    let venue

    before('create venue with image', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res.result
    })

    it('should add a series of workshops and try to remove the one with id 3 (which doesn\'t exist)', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.workshops = v.workshops.filter(ws => ws.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/workshop/3`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res4.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(422)
      expect(result.workshops.length).to.eql(3)
      expect(result.workshops).to.deep.include(Object.assign({}, mocks.ACTIVITY1, { id: 0 }))
      expect(result.workshops).to.deep.include(Object.assign({}, mocks.ACTIVITY3, { id: 2 }))
      expect(result.workshops).to.deep.include(Object.assign({}, mocks.ACTIVITY4, { id: 1 }))
    })

    it('should add a series of workshops and remove the one with id 1', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.workshops = v.workshops.filter(ws => ws.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/workshop`,
        payload: mocks.ACTIVITY4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/workshop/1`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res5.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)
      expect(result.workshops.length).to.eql(2)
      expect(result.workshops).to.deep.include(Object.assign({}, mocks.ACTIVITY1, { id: 0 }))
      expect(result.workshops).to.deep.include(Object.assign({}, mocks.ACTIVITY3, { id: 2 }))
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete workshops from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { workshops: [] } }
      )
    })
  })

  describe('replace workshops in venue', async function () {
    let venue

    before('create venue with image and add a workshop', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      let res = await server.inject({
        method: 'POST',
        url: '/venue/workshop',
        headers: headers,
        payload: mocks.ACTIVITY1
      })

      venue = res.result
    })

    it('should replace the workshop with the new workshops', async function () {
      let workshops = [
        mocks.ACTIVITY1,
        mocks.ACTIVITY2,
        mocks.ACTIVITY3,
        mocks.ACTIVITY4
      ]

      let res = await server.inject({
        method: 'PUT',
        url: '/venue/workshop',
        payload: workshops,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res.result

      expect(res.statusCode).to.eql(200)
      expect(result.workshops.length).to.eql(4)

      expect(result.workshops.map(ws => {
        delete ws.id
        return ws
      })).to.eql(workshops)
    })

    it('should give an error if one of the workshops has start >= end', async function () {
      let date = new Date()
      let workshops = [
        mocks.ACTIVITY1,
        {
          day: 2,
          start: date,
          end: date
        },
        mocks.ACTIVITY3
      ]

      let res = await server.inject({
        method: 'PUT',
        url: `/venue/workshop`,
        payload: workshops,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete workshops from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { workshops: [] } }
      )
    })
  })

  describe('add presentation to venue', async function () {
    let venue

    before('create venue with image', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res.result
    })

    it('should add a new presentation', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res.result

      expect(res.statusCode).to.eql(200)
      expect(result.presentations.length).to.eql(1)
      expect(result.presentations).to.deep.include(Object.assign({}, mocks.ACTIVITY1, { id: 0 }))
    })

    it('should add another presentation with incremented id', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res2.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(result.presentations.length).to.eql(2)
      expect(result.presentations).to.deep.include(Object.assign({}, mocks.ACTIVITY1, { id: 0 }))
      expect(result.presentations).to.deep.include(Object.assign({}, mocks.ACTIVITY2, { id: 1 }))
    })

    it('should add a presentation with id corresponding to the lowest number available', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.presentations = v.presentations.filter(pres => pres.id !== 0 && pres.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY5,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res5.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)

      expect(result.presentations.length).to.eql(3)
      expect(result.presentations[0]).to.deep.eql(Object.assign({}, mocks.ACTIVITY3, { id: 2 }))
      expect(result.presentations[1]).to.deep.eql(Object.assign({}, mocks.ACTIVITY4, { id: 0 }))
      expect(result.presentations[2]).to.deep.eql(Object.assign({}, mocks.ACTIVITY5, { id: 1 }))
    })

    it('should give an error if start >= end', async function () {
      let date = new Date()
      let res = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: {
          day: 1,
          start: date,
          end: date
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete presentations from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { presentations: [] } }
      )
    })
  })

  describe('delete a presentation in venue', async function () {
    let venue

    before('create venue with image', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res.result
    })

    it('should add a series of presentations and try to remove the one with id 3 (which doesn\'t exist)', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.presentations = v.presentations.filter(pres => pres.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/presentation/3`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res4.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(422)
      expect(result.presentations.length).to.eql(3)
      expect(result.presentations).to.deep.include(Object.assign({}, mocks.ACTIVITY1, { id: 0 }))
      expect(result.presentations).to.deep.include(Object.assign({}, mocks.ACTIVITY3, { id: 2 }))
      expect(result.presentations).to.deep.include(Object.assign({}, mocks.ACTIVITY4, { id: 1 }))
    })

    it('should add a series of presentations and remove the one with id 1', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.presentations = v.presentations.filter(ws => ws.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/presentation`,
        payload: mocks.ACTIVITY4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/presentation/1`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res5.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)
      expect(result.presentations.length).to.eql(2)
      expect(result.presentations).to.deep.include(Object.assign({}, mocks.ACTIVITY1, { id: 0 }))
      expect(result.presentations).to.deep.include(Object.assign({}, mocks.ACTIVITY3, { id: 2 }))
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete presentations from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { presentations: [] } }
      )
    })
  })

  describe('replace presentations in venue', async function () {
    let venue

    before('create venue with image and add a presentation', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      let res = await server.inject({
        method: 'POST',
        url: '/venue/presentation',
        headers: headers,
        payload: mocks.ACTIVITY1
      })

      venue = res.result
    })

    it('should replace the presentation with the new presentations', async function () {
      let presentations = [
        mocks.ACTIVITY1,
        mocks.ACTIVITY2,
        mocks.ACTIVITY3,
        mocks.ACTIVITY4
      ]

      let res = await server.inject({
        method: 'PUT',
        url: '/venue/presentation',
        payload: presentations,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res.result

      expect(res.statusCode).to.eql(200)
      expect(result.presentations.length).to.eql(4)

      expect(result.presentations.map(pres => {
        delete pres.id
        return pres
      })).to.eql(presentations)
    })

    it('should give an error if one of the presentations has start >= end', async function () {
      let date = new Date()
      let presentations = [
        mocks.ACTIVITY1,
        {
          day: 2,
          start: date,
          end: date
        },
        mocks.ACTIVITY3
      ]

      let res = await server.inject({
        method: 'PUT',
        url: `/venue/presentation`,
        payload: presentations,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete presentations from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { presentations: [] } }
      )
    })
  })
})
