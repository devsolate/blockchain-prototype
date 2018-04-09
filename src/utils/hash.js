'use strict'

const crypto = require('crypto')
const RIPEMD160 = require('ripemd160')

const sha256 = (text) => {
    const hash = crypto.createHash('sha256')
    hash.update(text)
    return hash.digest('hex')
}

const ripemd160 = (text) => {
    const hash = new RIPEMD160()
    hash.end(text)
    return hash.read().toString('hex')
}

module.exports = {
    sha256,
    ripemd160
}