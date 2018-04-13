'use strict'

const moment = require('moment')
const Hash = require('./utils/Hash')
const Transaction = require('./transaction')
const genesisBlockSignature = "It's a start point of everything"
const genesisBlockCoin = 1000

class Block {
    constructor(timestamp, transactions, hash, prevBlockHash, nonce) {
        this.timestamp = timestamp
        this.transactions = transactions
        this.hash = hash
        this.prevBlockHash = prevBlockHash
        this.nonce = nonce
    }

    toJSON() {
        return {
            timestamp: this.timestamp,
            transactions: this.transactions.map((item) => {
                return item.toJSON()
            }),
            hash: this.hash,
            prevBlockHash: this.prevBlockHash,
            nonce: this.nonce
        }
    }
}

const create = async (transactions, prevBlockHash) => {
    const timestamp = moment().unix()
    const verifiedTrxns = transactions.filter((item) => {
        return item.verify()
    }) 
    if(verifiedTrxns && verifiedTrxns.length > 0) {
        const block = new Block(timestamp, verifiedTrxns, '', prevBlockHash)
        return Promise.resolve(block)
    } else {
        return Promise.reject("No verify trxn")
    }
}

const createGenesisBlock = (targetAddress) => {
    const trxn = Transaction.coinbase(targetAddress, genesisBlockCoin)
    const block = create([trxn], '')
    return block
}

module.exports = {
    create,
    createGenesisBlock
}