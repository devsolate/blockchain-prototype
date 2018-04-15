'use strict'

const Block = require('./Block')
const Transaction = require('./transaction')
const Wallet = require('./wallet')
const ProofOfWork = require('./pow')
const blockchainFilePath = './blockchain.db'
const latestHashFilePath = './latestHash.db'
const transactionsFilePath = './transaction.db'
const Datastore = require('nedb');

class Blockchain {
    constructor() {

        this.db = {}
        this.latestHash = ''
        this.tempTransactions = []

        this.connectDB()
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
        db.transactions = new Datastore({
            filename: transactionsFilePath,
            autoload: true
        })
        this.db = db
    }

    getLatestHash() {
        return new Promise((resolve, reject) => {
            this.db.latestHash.findOne({}).exec((err, latest) => {
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

    getIterator() {
        return new BlockchainIterator(this, this.latestHash)
    }

    async mine() {
        const trxns = await this.getTransactions()
        const transactions = trxns.map((item) => {
            return new Transaction.instance(item.id, item.vin, item.vout)
        })
        const block = await Block.create(transactions, this.latestHash)
        const pow = ProofOfWork.create(block)
        const mine = await pow.run()

        block.hash = mine.hash
        block.nonce = mine.nonce

        try {
            await this.saveBlock(block.toJSON())
            await this.saveLatestHash(block.hash)
            this.latestHash = block.hash
            await this.clearTransactions()

            return Promise.resolve(block)
        } catch (error) {
            return Promise.reject(error)
        }
    }

    find(hash) {
        return new Promise((resolve, reject) => {
            this.db.blockchain.findOne({ hash: hash }, (err, block) => {
                if (block) {
                    return resolve(block)
                } else {
                    return resolve(null)
                }
            })
        })
    }


    findNext(prevBlockHash) {
        return new Promise((resolve, reject) => {
            this.db.blockchain.findOne({ prevBlockHash: prevBlockHash }, (err, block) => {
                if (block) {
                    return resolve(block)
                } else {
                    return resolve(null)
                }
            })
        })
    }

    saveBlock(block) {
        return new Promise((resolve, reject) => {
            this.db.blockchain.findOne({ hash: block.hash }, (err, currentBlock) => {
                
                if(err) {
                    return reject(err)
                }

                if (!currentBlock) {
                    this.db.blockchain.insert(block, (err, newBlock) => {
                        if (!err) {
                            resolve()
                        } else {
                            reject(err)
                        }
                    })
                } else {
                    return resolve()
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
            this.db.blockchain.find({}, (err, blocks) => {
                if (blocks.length == 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })
    }

    async createTrxn(wallet, to, amount = 0) {
        try {
            const trxn = await Transaction.create(this, wallet, to, amount)
            await this.saveTransaction(trxn)
            return Promise.resolve(trxn)
        } catch(error) {
            return Promise.reject(error)
        }
    }

    async saveTransaction(trxn) {
        return new Promise((resolve, reject) => {
            this.db.transactions.insert(trxn, (err, newBlock) => {
                if (!err) {
                    resolve()
                } else {
                    reject(err)
                }
            })
        })
    }

    async getTransactions() {
        return new Promise((resolve, reject) => {
            this.db.transactions.find({}, (err, transactions) => {
                if(err) {
                    return reject(err)
                }

                return resolve(transactions)
            })
        })
    }

    async clearTransactions() {
        return new Promise((resolve, reject) => {
            this.db.transactions.remove({}, { multi: true }, (err, transactions) => {
                if(err) {
                    return reject(err)
                }

                return resolve(transactions)
            })
        })
    }

    async findBalance(address) {
        const unused = await Transaction.findUnusedTransactions(this, address)
        return Promise.resolve(unused.sum)
    }
}

class BlockchainIterator {
    constructor(blockchain, currentHash) {
        this.blockchain = blockchain
        this.currentHash = currentHash
    }

    async next() {
        try {
            // Get a next block from chain
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

            // Create Genesis Block and Target Address an Initial Coin
            const block = await Block.createGenesisBlock(address)
            const pow = ProofOfWork.create(block)
            const mine = await pow.run()

            block.hash = mine.hash
            block.nonce = mine.nonce

            // Save to DB
            await blockchain.saveBlock(block.toJSON())
            await blockchain.saveLatestHash(block.hash)

            return Promise.resolve(block)
        } else {
            return Promise.reject("Blockchain is already initialized")
        }
    } catch (err) {
        return Promise.reject(err)
    }
}

const get = async () => {
    try {
        const blockchain = new Blockchain()
        // const isEmpty = await blockchain.isEmpty()
        // if (isEmpty) {
        //     return Promise.reject("Blockchain is not initialized")
        // }
        // Get blockchain latest hash from DB
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