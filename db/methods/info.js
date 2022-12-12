/* eslint-disable space-before-function-paren */
let path = require('path')
let Info = require(path.join(__dirname, '..', 'models', 'info'))

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

async function isInfoValid(info, titles) {
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
        const regex = "/[A-Z1-9]/g"

        info.licensePlates.array.forEach(element => {
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
            result.error = "Titles can only contain ONLY 30 characters!"
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

  module.exports.findOne = findOne
  module.exports.addInfo = addInfo
  module.exports.isInfoValid = isInfoValid
  module.exports.canSubmitInfo = canSubmitInfo