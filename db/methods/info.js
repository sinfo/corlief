/* eslint-disable space-before-function-paren */
const { logger } = require('handlebars')
let path = require('path')
let Info = require(path.join(__dirname, '..', 'models', 'info'))

function arrayToJSON(infos) {
  return infos.map(info => info.toJSON())
}

async function find(edition) {
    return Info.find(edition)
}

async function findOne(companyId, edition) {
    return Info.findOne({
      companyId: companyId,
      edition: edition
    })
}

async function addInfo(companyId, edition, info, titles) {
    let newInfo = new Info({
        companyId: companyId,
        edition: edition,
        info: info,
        titles: titles,
        created: new Date()
    })

    return newInfo.save()
}

function isInfoValid(info, titles) {
    let result = {
        error: null,
        valid: false
    }

    if (info.numberOfPeople === null) {
        result.error = "A number of people must be specified"
        return result
    }
    
    if (info.numberOfPeople <= 0) {
        result.error = "The number of people must be higher or equal to 1"
        return result
    }

    if (info.licensePlates) {
        const regex = "..-..-.."

        info.licensePlates.forEach(element => {
            if (!element.match(regex)) {
                result.error = "Invalid license plate provided"
            }
        })

        if (result.error) {
            return result
        }
    }

    if (titles.presentation && titles.presentation.length > 30 || 
        titles.lunchTalk && titles.presentation.length > 30 ||
        titles.workshop && titles.workshop.length > 30) {
            result.error = "Titles can only contain 30 characters!"
            return result
    }

    result.valid = true
    return result
}

async function canSubmitInfo(companyId, edition) {
    let response = {
      result: true,
      error: null
    }
  
    let info = await findOne(companyId, edition)
  
    if (info === null) {
      return response
    }
  
    if (latest.feedback.status === 'CONFIRMED') {
      response.result = false
      response.error = 'Company info confirmed'
      return response
    }
  
    if (latest.feedback.status === 'PENDING') {
      response.result = false
      response.error = 'Company info pending validation'
      return response
    }
  
    return response
}

async function confirm(companyId, edition, member) {
    let result = {
      data: null,
      error: null
    }
  
    let info = await findOne(companyId, edition)
  
    if (info === null) {
      result.error = 'No company info found'
      return result
    }
  
    result.data = await info.confirm(member)
    return result
}

async function cancel(companyId, edition, member) {
    let info = await findOne(companyId, edition)
  
    if (info === null) {
      return null
    }
  
    return info.cancel(member)
}

module.exports.find = find
module.exports.findOne = findOne
module.exports.addInfo = addInfo
module.exports.isInfoValid = isInfoValid
module.exports.canSubmitInfo = canSubmitInfo
module.exports.confirm = confirm
module.exports.cancel = cancel
module.exports.arrayToJSON = arrayToJSON