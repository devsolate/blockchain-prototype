'use strict'

const Decode = require('./decode')
const Hash = require('./hash')
const forge = require('node-forge')
const pki = forge.pki

const sign = (publicKeyPem, data, signature) => {

    const md = forge.md.sha1.create()
    md.update(data, 'utf8');

    const publicKey = pki.publicKeyFromPem(publicKeyPem)
    return publicKey.verify(md.digest().bytes(), signature)
}

const address = (data) => {
    const decoded = Decode.base58(data)
    const version = decoded.substr(0, 2)
    const body = decoded.substr(2, decoded.length - 10)
    const checksum = decoded.substr(decoded.length - 8)
    
    const verifyBodyChecksum = Hash.sha256(Hash.sha256(body)).substr(0, 8)
    return verifyBodyChecksum == checksum
}

module.exports = {
    sign,
    address
}