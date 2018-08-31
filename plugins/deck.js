const request = require('request-promise')
const path = require('path')
const config = require(path.join(__dirname, '..', 'config'))

const URL = `${config.DECK.HOST}:${config.DECK.PORT}/api`

async function validateToken (user, token) {
  try {
    await request({
      method: 'GET',
      uri: `${URL}/auth/login/${user}/${token}`,
      json: true
    })

    return true
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 401) {
      return false
    }

    throw err
  }
}

async function getLatestEdition () {
  const events = await request({
    method: 'GET',
    uri: `${URL}/events`,
    json: true
  })

  let latestEvent = events.length > 0 ? events[0] : null
  let latestEventDate = events.length > 0 ? new Date(events[0].date).getTime() : null

  events.forEach(event => {
    let thisDate = new Date(event.date).getTime()
    if (thisDate > latestEventDate) {
      latestEvent = event
      latestEventDate = thisDate
    }
  })

  return latestEvent
}

async function validateCompanyId (companyId) {
  try {
    await request({
      method: 'GET',
      uri: `${URL}/companies/${companyId}`,
      json: true
    })

    return true
  } catch (err) {
    if (err.statusCode === 404) {
      return false
    }

    throw err
  }
}

async function getCompanies (edition) {
  let companies = await request({
    method: 'GET',
    uri: `${URL}/companies?event=${edition}&participations=true`,
    json: true
  })

  let result = companies.map(company => {
    return {
      id: company.id,
      name: company.name,
      img: company.img
    }
  })

  return result
}

module.exports = {
  name: 'deck',
  version: '1.0.0',
  register: async (server, options) => {
    server.method('deck.validateToken', validateToken)
    server.method('deck.validateCompanyId', validateCompanyId)
    server.method('deck.getLatestEdition', getLatestEdition)
    server.method('deck.getCompanies', getCompanies)
  }
}
