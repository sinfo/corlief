const request = require('request-promise')

request.defaults({
  jar: true
})

const path = require('path')
const config = require(path.join(__dirname, '..', 'config'))

const URL = `${config.DECK.HOST}:${config.DECK.PORT}/api/public`

async function validateToken (user, token) {
  try {
    await request({
      method: 'GET',
      uri: `${URL}/auth/login/${user}/${token}`,
      json: true,
      jar: true
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
  const event = await request({
    method: 'GET',
    uri: `${URL}/events/latest`,
    json: true
  })

  return event
}

async function validateCompanyId (companyId) {
  try {
    await request({
      method: 'GET',
      uri: `${URL}/companies/${companyId}`,
      json: true,
      jar: true
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
    uri: `${URL}/companies?event=${edition}`,
    json: true,
    jar: true
  })

  companies = companies.filter(company => {
    if (company.participation === undefined || company.participation.length === 0) {
      return false
    }

    const participation = company.participation[0]
    return company.partner
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

async function getCompany (companyId) {
  const company = await request({
    method: 'GET',
    uri: `${URL}/companies/${companyId}`,
    json: true,
    jar: true
  })

  return company
}

async function getMember (memberId) {
  const member = await request({
    method: 'GET',
    uri: `${URL}/members/${memberId}`,
    json: true,
    jar: true
  })
  return member
}

module.exports = {
  name: 'deck',
  version: '1.0.0',
  register: async (server, options) => {
    server.method('deck.validateToken', validateToken)
    server.method('deck.validateCompanyId', validateCompanyId)
    server.method('deck.getLatestEdition', getLatestEdition)
    server.method('deck.getCompanies', getCompanies)
    server.method('deck.getCompany', getCompany)
    server.method('deck.getMember', getMember)
  }
}
