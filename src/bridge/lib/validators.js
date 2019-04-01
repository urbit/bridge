import * as bip39 from 'bip39';
import * as ob from 'urbit-ob';

import { isValidAddress } from './wallet'

const hexRegExp = /[0-9A-Fa-f]{64}/g


// // Note that this validator also transforms data
// const validateBase64 = ({ data, pass, error }) => {
//   if (pass !== true) return { data, pass, error }
//
//   try {
//     atob(data);
//     return { data: atob(data), pass: true, error: '' }
//   } catch(e) {
//     return { data: data, pass: false, error: 'File is not valid base64.' }
//   }
// };
//
// // Note that this validator also transforms data
// const validateJSON = ({ data, pass, error }) => {
//   if (pass !== true) return { data, pass, error }
//
//   try {
//     JSON.parse(data)
//     return { data: JSON.parse(data), pass: true, error: '' }
//   } catch(e) {
//     return { data: data, pass: false, error: 'File does not decode into valid JSON.' }
//   }
// };





// Validates a bip39 mnemonic
const validateMnemonic = m => simpleValidatorWrapper({
  prevMessage: m,
  validator: d => bip39.validateMnemonic(d),
  errorMessage: 'This is not a valid mnemonic.'
});


// Checks an empty field
const validateNotEmpty = m => simpleValidatorWrapper({
  prevMessage: m,
  validator: d => d.length > 1,
  errorMessage: 'This field is required.'
});



// Checks if a patp is a valid galaxy
const validateGalaxy = m => simpleValidatorWrapper({
  prevMessage: m,
  validator: d => {
    let point
    try {
      point = parseInt(ob.patp2dec(d), 10)
      return point >= 0 && point < 256
    } catch(e) {
      return false
    }
  },
  errorMessage: 'This is not a valid galaxy'
});



const validatePoint = m => simpleValidatorWrapper({
  prevMessage: m,
  validator: d => {
    try {
      return ob.isValidPatp(d)
    } catch(e) {
      return false
    }
  },
  errorMessage: 'This is not a valid point'
});



const validateTicket = m => simpleValidatorWrapper({
  prevMessage: m,
  validator: d => {
    try {
      return ob.isValidPatq(d)
    } catch(e) {
      return false
    }
  },
  errorMessage: 'This is not a valid ticket'
});


const validateShard = m => simpleValidatorWrapper({
  prevMessage: m,
  validator: d => {
    try {
      return ob.isValidPatq(d)
    } catch(e) {
      return false
    }
  },
  errorMessage: 'This is not a valid shard'
});


const validateLength = (m, l) => simpleValidatorWrapper({
  prevMessage: m,
  validator: d => d.length === l,
  errorMessage: 'This is of an invalid length'
});


const validateNetworkKey = m => simpleValidatorWrapper({
  prevMessage: m,
  validator: d => hexRegExp.test(d),
  errorMessage: 'This is not a valid network key'
});


const validateNetworkSeed = m => simpleValidatorWrapper({
  prevMessage: m,
  validator: d => hexRegExp.test(d),
  errorMessage: 'This is not a valid network seed'
});



// Checks if a string is a valid ethereum address
const validateEthereumAddress = m => simpleValidatorWrapper({
  prevMessage: m,
  validator: d => isValidAddress(d),
  errorMessage: 'This is not a valid Ethereum address'
});





// Wraps single validation functions in a controlled and predictable way.
const simpleValidatorWrapper = config => {

  // If a previous validation has already failed, skip this validation and
  // return the prev message to the next stage in the validation function chain.
  // Failed validations should drop all the way down the chain and drop out of
  // the output.
  if (config.prevMessage.pass !== true) return config.prevMessage

  // Run the validator and return the result.
  return config.validator(config.prevMessage.data)
    ? newMessage(config.prevMessage.data, true, '')
    : newMessage(config.prevMessage.data, false, config.errorMessage)
}

// Validation message
// {
//   data: ...
//   pass: ...
//   error: ...
// }
// Creates a new validation message in a uniform way.
const newMessage = (data, pass, error) => ({
  // The input data
  data,
  // Has the data passed validation?
  pass,
  // If data has failed a validator, the error message goes here.
  error,
})



export {
  // validateBase64,
  // validateJSON,
  validateMnemonic,
  validateNotEmpty,
  validateGalaxy,
  validateEthereumAddress,
  validatePoint,
  validateTicket,
  validateShard,
  validateLength,
  validateNetworkKey,
  validateNetworkSeed
}
