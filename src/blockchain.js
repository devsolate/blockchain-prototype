'use strict'

const Block = require('./Block')
const blockchainFilePath = 'blockchain.db'
const latestHashFilePath = 'latestHash.db'
const Datastore = require('nedb');

class Blockchain {
    constructor() {
        let db = {};
        db.blockchain = new Datastore({
            filename: blockchainFilePath,
            autoload: true
        });
        db.latestHash = new Datastore({
            filename: latestHashFilePath,
            autoload: true
        });

        this.db = db
        this.latestHash = ''
    }

    async getLatestHash() {
        return new Promise((resolve, reject) => {
            this.db.latestHash
                .findOne({})
                .exec((err, latest) => {
                    if (err) {
                        return reject(err)
                    }

                    return resolve(latest.latestHash)
                })
        })
    }

    getIterator() {
        return new BlockchainIterator(this, this.latestHash)
    }

    newBlock(data) {
        return new Promise(async (resolve, reject) => {
            const block = Block.create(data, this.latestHash)
            try {
                await this.insert(block.toJSON())
                await this.saveLatestHash(block.hash)
                this.latestHash = block.hash
                resolve(block)
            } catch(error) {
                reject(error)
            }
        })
    }

    find(hash) {
        return new Promise((resolve, reject) => {
            this.db.blockchain
            .findOne({ hash: hash }, (err, block) => {
                if (block) {
                    resolve(block)
                } else {
                    resolve(null)
                }
            })
        })
    }

    insert(block) {
        return new Promise((resolve, reject) => {
            this.db.blockchain.insert(block, (err, newBlock) => {
                if (!err) {
                    resolve()
                } else {
                    reject(err)
                }
            })
        })
    }

    saveLatestHash(latestHash) {
        return new Promise((resolve, reject) => {
            this.db.latestHash.findOne({}, (err, hash) => {
                if (err) {
                    reject(err)
                }

                if (!hash) {
                    this.db.latestHash.insert({
                        latestHash: latestHash
                    }, (err, newHash) => {
                        if (!err) {
                            resolve()
                        } else {
                            reject(err)
                        }
                    })
                } else {
                    this.db.latestHash.update({
                        _id: hash._id
                    }, {
                        latestHash: latestHash
                    }, (err, newHash) => {
                        if (!err) {
                            resolve()
                        } else {
                            reject(err)
                        }
                    })
                }
            })
        })
    }

    isEmpty() {
        return new Promise((resolve, reject) => {
            this.db.blockchain.find({}, function (err, blocks) {
                if (blocks.length == 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })
    }
}

class BlockchainIterator {
    constructor(blockchain, currentHash) {
        this.blockchain = blockchain
        this.currentHash = currentHash
    }

    next() {
        return new Promise( async (resolve, reject) => {
            try {
                const nextBlock = await this.blockchain.find(this.currentHash)
                if(nextBlock) {
                    this.currentHash = nextBlock.prevBlockHash
                    resolve(nextBlock)
                } else {
                    resolve(null)
                }
            } catch(error) {
                reject(error)
            }
        })
    }
}

const init = async () => {
    try {
        const blockchain = new Blockchain()
        const isEmpty = await blockchain.isEmpty()
        if (isEmpty) {

            const gBlock = Block.createGenesisBlock()
            await blockchain.insert(gBlock.toJSON())
            await blockchain.saveLatestHash(gBlock.hash)

            console.log("Genesis Block Created")
            console.log("Data: ", gBlock.data)
            console.log("Hash: ", gBlock.hash)
            console.log("PrevBlockHash: ", gBlock.prevBlockHash)
        } else {
            console.log("Blockchain is already initialized")
        }
    } catch (err) {
        console.log(err)
    }
}

const get = () => {
    return new Promise( async (resolve, reject) => {
        const blockchain = new Blockchain()
        
        try {
            blockchain.latestHash = await blockchain.getLatestHash()
            resolve(blockchain)
        } catch(error) {
            reject(error)
        } 
    })
}

module.exports = {
    init,
    get
}