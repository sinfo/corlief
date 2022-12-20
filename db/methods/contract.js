/* eslint-disable space-before-function-paren */
let path = require('path')
let Contract = require(path.join(__dirname, '..', 'models', 'contract'))

function arrayToJSON(contracts) {
  return contracts.map(contract => contract.toJSON())
}

async function find(filter) {
  return Contract.find(filter)
}

async function findOne(companyId, edition) {
  return Contract.findOne({
    companyId: companyId,
    edition: edition
  })
}

async function submitContract(companyId, edition, fileName) {
  let newContract = new Contract({
    companyId: companyId,
    edition: edition,
    created: new Date(),
    fileName: fileName
  })

  return newContract.save()
}

async function deleteContract(companyId, edition) {
  return Contract.findOneAndRemove({
    companyId: companyId,
    edition: edition
  })
}

async function isContractAccepted(companyId, edition) {
  let response = {
    result: null,
    error: null
  }

  let contract = await findOne(companyId, edition)

  if (contract === null) {
    return response
  }

  if (contract.feedback.status === 'CONFIRMED') {
    response.result = true
    response.error = 'Contract verified'
    return response
  }

  if (contract.feedback.status === 'PENDING') {
    response.result = false
    response.error = 'Contract pending verification'
    return response
  }

  return response
}

async function confirm(companyId, edition, member) {
  let result = {
    data: null,
    error: null
  }

  let contract = await findOne(companyId, edition)

  if (contract === null) {
    result.error = 'No contract found'
    return result
  }

  result.data = await contract.confirm(member)
  return result
}

async function cancel(companyId, edition, member) {
  let contract = await findOne(companyId, edition)

  if (contract === null) {
    return null
  }

  return contract.cancel(member)
}

module.exports.arrayToJSON = arrayToJSON
module.exports.find = find
module.exports.submitContract = submitContract
module.exports.deleteContract = deleteContract
module.exports.isContractAccepted = isContractAccepted
module.exports.findOne = findOne
module.exports.confirm = confirm
module.exports.cancel = cancel
