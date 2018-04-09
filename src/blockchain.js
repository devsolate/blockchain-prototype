'use strict'

const Block = require('./Block')
const Transaction = require('./transaction')
const TrxnUtil = require('./utils/transaction')
const blockchainFilePath = 'blockchain.db'
const latestHashFilePath = 'latestHash.db'
const Datastore = require('nedb');

class Blockchain {
    constructor() {

        this.db = {}
        this.latestHash = ''
        this.tempTransactions = []

        this.connectDB()
    }

    connectDB() {
        let db = {}
        db.blockchain = new Datastore({
            filename: blockchainFilePath,
            autoload: true
        })
        db.latestHash = new Datastore({
            filename: latestHashFilePath,
            autoload: true
        })
        this.db = db
    }

    getLatestHash() {
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
    async mine() {
        const data = this.tempTransactions
        const block = Block.create(data, this.latestHash)
        block.setHash()

        try {
            await this.insert(block.toJSON())
            await this.saveLatestHash(block.hash)
            this.latestHash = block.hash
            this.tempTransactions = []

            return Promise.resolve(block)
        } catch (error) {
            return Promise.reject(error)
        }
    }
    find(hash) {
        return new Promise((resolve, reject) => {
            this.db.blockchain
                .findOne({
                    hash: hash
                }, (err, block) => {
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
    async createTrxn(from, to, amount = '0') {
        amount = parseInt(amount)
        const unusedTrxns = await this.findAvailableTransactions(from, amount)
        const sum = TrxnUtil.getBalance(unusedTrxns)
        if(sum >= amount) {
            const trxnInputs = TrxnUtil.getTrxnInputsFormat(unusedTrxns, from)
            const trxnOutput = [{
                address: from,
                value: sum - amount
            }, {
                address: to,
                value: amount
            }]
            const trxn = Transaction.create(trxnInputs, trxnOutput)
            this.tempTransactions = [
                ...this.tempTransactions,
                trxn
            ]
            return Promise.resolve(trxn)
        }
    }
    async findBalance(address) {
        const iterator = this.getIterator()
        const unusedTrxns = await TrxnUtil.findUnused(iterator, address)
        const sum = TrxnUtil.getBalance(unusedTrxns)
        return Promise.resolve(sum)
    }
    async findAvailableTransactions(address, amount) {
        const iterator = this.getIterator()
        const result = TrxnUtil.findUnused(iterator, address, amount)
        return Promise.resolve(result)
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
            if (nextBlock) {
                this.currentHash = nextBlock.prevBlockHash
                return Promise.resolve(nextBlock)
            } else {
                return Promise.resolve(null)
            }
        } catch (error) {
            return Promise.reject(error)
        }
    }
}

const init = async (address) => {
    try {
        const blockchain = new Blockchain()
        const isEmpty = await blockchain.isEmpty()
        if (isEmpty) {

            const block = Block.createGenesisBlock(address)
            block.setHash()
            await blockchain.insert(block.toJSON())
            await blockchain.saveLatestHash(block.hash)

            return Promise.resolve(block)
        } else {
            console.log("Blockchain is already initialized")
            return Promise.reject()
        }
    } catch (err) {
        return Promise.reject(err)
    }
}

const get = async () => {
    const blockchain = new Blockchain()

    try {
        blockchain.latestHash = await blockchain.getLatestHash()
        return Promise.resolve(blockchain)
    } catch (error) {
        return Promise.reject(error)
    }
}

module.exports = {
    init,
    get
}