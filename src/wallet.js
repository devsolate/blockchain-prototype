'use strict'

const forge = require('node-forge')
const randomstring = require('randomstring')
const Hash = require('./utils/hash')
const Encode = require('./utils/encode')
const fs = require('fs')
const pki = forge.pki
const rsa = pki.rsa

class Wallet {
    constructor(privateKey, publicKey) {
        this.privateKey = privateKey
        this.publicKey = publicKey
    }

    getWalletAddress() {
        const hashSha = Hash.sha256(this.publicKey)
        const hashed = Hash.ripemd160(hashSha)
        return Encode.base58(hashed)
    }

    exportPrivateKey() {
        savePrivateKeyToPemFile(this.privateKey)
    }
}

const create = async (password) => {
    try {
        console.log("Generating PublicKey / PrivateKey")

        const keypair = await generateRsaKeypair(password)
        const wallet = new Wallet(keypair.privateKey, keypair.publicKey)
        
        return Promise.resolve(wallet)
    } catch(error) {
        return Promise.reject(error)
    }
}

const generateRsaKeypair = (password) => {
    return new Promise((resolve, reject) => {
        rsa.generateKeyPair({
            bits: 2048,
            workers: 2
        }, (err, keypair) => {
            if (err) {
                return reject(err)
            }

            return resolve({
                publicKey: pki.publicKeyToPem(keypair.publicKey),
                privateKey: pki.encryptRsaPrivateKey(keypair.privateKey, password)
            })
        })
    })
}


const savePrivateKeyToPemFile = (privateKey) => {
    const rand = randomstring.generate(10)
    fs.writeFile("./temp/" + rand + ".pem", privateKey, (err) => {
        if (err) {
            return console.log(err);
        }
    })
}

const load = async (filePath, password) => {
    const privateKeyPem = await loadWalletFromFile(filePath)
    const privateKey = pki.decryptRsaPrivateKey(privateKeyPem, password)
    if(privateKey) {
        const publicKey = rsa.setPublicKey(privateKey.n, privateKey.e)
        const publicKeyPem = pki.publicKeyToPem(publicKey)
        
        return new Wallet(privateKeyPem, publicKeyPem)
    } else {
        return Promise.reject("Password is invalid")
    }
}

const loadWalletFromFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, function(err, data) {
            const fileData = data.toString()
            
            resolve(fileData)
        })
    })
}

module.exports = {
    create,
    load
}