'use strict'

const forge = require('node-forge')
const pki = forge.pki

const sign = (publicKeyPem, data, signature) => {
    const md = forge.md.sha1.create()
    md.update(data, 'utf8');

    const publicKey = pki.publicKeyFromPem(publicKeyPem)
    return publicKey.verify(md.digest().bytes(), signature)
}

module.exports = {
    sign
}