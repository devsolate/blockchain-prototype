'use strict'

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const bs58 = require('base-x')(BASE58)

const base58 = (text, format = 'hex') => {
    return bs58.decode(text).toString(format)
}

module.exports = {
    base58
}