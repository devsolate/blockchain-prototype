'use strict'

const Block = require('./Block')
const blockchainFilePath = 'blockchain.db'
const latestHashFilePath = 'latestHash.db'
const Datastore = require('nedb');

class Blockchain {
    constructor() {
        this.db = {}
        this.latestHash = ''
    }

    async connect() {
        try {
            this.db = this.connectDB()
            this.latestHash = await this.getLatestHash()
            
            return Promise.resolve()
        } catch(error) {
            return Promise.reject(error)
        }
    }

    connectDB() {
        const db = {}
        db.blockchain = new Datastore({
            filename: blockchainFilePath,
            autoload: true
        })
        db.latestHash = new Datastore({
            filename: latestHashFilePath,
            autoload: true
        })
        return db
    }

    getIterator() {
        return new BlockchainIterator(this, this.latestHash)
    }

    async mine(data) {
        try {
            // Create New Block and Set Hash
            const block = Block.create(data, this.latestHash)
            block.setHash()

            // Save to DB
            await this.insert(block.toJSON())
            await this.saveLatestHash(block.hash)
            this.latestHash = block.hash

            return Promise.resolve(block)
        } catch(error) {
            return Promise.reject(error)
        }
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
                    return reject(err)
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

    async getLatestHash() {
        return new Promise((resolve, reject) => {
            this.db.latestHash
                .findOne({})
                .exec((err, latest) => {
                    if (err) {
                        return reject(err)
                    }

                    if(latest) {
                        return resolve(latest.latestHash)
                    } else {
                        return resolve("")
                    }
                })
        })
    }

    async init() {
        try {
            
            const isEmpty = await this.isEmpty()
            if (isEmpty) {
    
                const block = Block.createGenesisBlock()
                block.setHash()
    
                await this.insert(block.toJSON())
                await this.saveLatestHash(block.hash)
                this.latestHash = block.hash
    
                return Promise.resolve(block)
            } else {
                return Promise.reject("Blockchain is already initialized")
            }
        } catch (err) {
            return Promise.reject(err)
        }
    }
}

class BlockchainIterator {
    constructor(blockchain, currentHash) {
        this.blockchain = blockchain
        this.currentHash = currentHash
    }

    async next() {
        try {
            const nextBlock = await this.blockchain.find(this.currentHash)
            if(nextBlock) {
                this.currentHash = nextBlock.prevBlockHash
                return Promise.resolve(nextBlock)
            } else {
                return Promise.resolve(null)
            }
        } catch(error) {
            return Promise.reject(error)
        }
    }
}

module.exports = Blockchain