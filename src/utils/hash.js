'use strict'

const crypto = require('crypto')

const sha256 = (text) => {
    const hash = crypto.createHash('sha256')
    hash.update(text)
    return hash.digest('hex')
}

module.exports = {
    sha256
}