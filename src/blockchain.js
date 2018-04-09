'use strict'

const Block = require('./Block')
const dbFilePath = 'blockchain.db'
const Datastore = require('nedb');
const db = new Datastore({
    filename: dbFilePath,
    autoload: true
});

function Blockchain(db, latestHash) {
    this.db = db
    this.latestHash = latestHash

    this.getPreviousBlock = () => {

    }
}

const init = async () => {
    try {
        const isEmpty = await isBlockchainEmpty()
        if (isEmpty) {
            // Initialize New Blockchain
            console.log("Initializing Blockchain")

            // Generate Genesis Block
            const genesisBlock = Block.createGenesisBlock()
            await saveDataToDB(genesisBlock.hash, genesisBlock.toString())

            console.log("Genesis Block Created")
            console.log("Data: ", genesisBlock.data)
            console.log("Hash: ", genesisBlock.hash)
            console.log("PrevBlockHash: ", genesisBlock.prevBlockHash)
        } else {
            console.log("Blockchain is already initialized")
        }
    } catch (err) {
        console.log(err)
    }
}

const isBlockchainEmpty = () => {
    return new Promise((resolve, reject) => {
        db.find({}, function (err, blocks) {
            if (blocks.length == 0) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}

const saveDataToDB = (hash, data) => {
    return new Promise((resolve, reject) => {
        db.insert({
            latestHash: hash,
            block: data
        }, function (err, newBlock) {
            if (!err) {
                resolve()
            } else {
                reject(err)
            }
        })
    })
}

module.exports = {
    init
}