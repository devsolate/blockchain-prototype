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

    get address() {
        const hashSha = Hash.sha256(this.publicKey)
        const hashed = Hash.ripemd160(hashSha)
        return Encode.base58(hashed)
    }

    sign(data) {
        const md = forge.md.sha1.create()
        md.update(data, 'utf8')
        const signature = this.privateKey.sign(md)
        return signature
    }

    exportPrivateKey(password) {
        const encryptedPrivateKey = pki.encryptRsaPrivateKey(this.privateKey, password)
        savePrivateKeyToPemFile(encryptedPrivateKey)
    }
}

const create = async (password) => {
    try {
        console.log("Generating PublicKey / PrivateKey.....")

        const keypair = await generateRsaKeypair(password)
        const wallet = new Wallet(keypair.privateKey, keypair.publicKey)
        
        return Promise.resolve(wallet)
    } catch(error) {
        return Promise.reject(error)
    }
}

const generateRsaKeypair = () => {
    return new Promise((resolve, reject) => {
        rsa.generateKeyPair({
            bits: 2048,
            workers: 2
        }, (err, keypair) => {
            if (err) {
                return reject(err)
            }

            const publicKey = pki.publicKeyToPem(keypair.publicKey)
            const privateKey = keypair.privateKey

            return resolve({
                publicKey: publicKey,
                privateKey: privateKey
            })
        })
    })
}


const savePrivateKeyToPemFile = (privateKey) => {
    const rand = randomstring.generate(10)

    // Save in temp folder
    fs.writeFile("./temp/" + rand + ".pem", privateKey, (err) => {
        if (err) {
            return console.log(err);
        }
    })
}

const load = async (filePath, password) => {
    try {
        // Load and decrypt a private key file with password
        const privateKeyPem = await loadWalletFromFile(filePath)
        const privateKey = pki.decryptRsaPrivateKey(privateKeyPem, password)
        
        if(privateKey) {
            // Private Key Valid - Generate a public key from it
            const publicKey = rsa.setPublicKey(privateKey.n, privateKey.e)
            const publicKeyPem = pki.publicKeyToPem(publicKey)
            
            return new Wallet(privateKey, publicKeyPem)
        } else {
            return Promise.reject("Password is invalid")
        }
    } catch(error) {
        return Promise.reject(error)
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