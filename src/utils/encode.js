'use strict'

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const bs58 = require('base-x')(BASE58)

const base58 = (text) => {
    return bs58.encode(new Buffer(text))
}

module.exports = {
    base58
}