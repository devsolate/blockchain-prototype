'use strict'

const moment = require('moment')
const crypto = require('crypto')
const Transaction = require('./transaction')
const genesisBlockSignature = "It's a start point of everything"
const genesisBlockCoin = 1000

class Block {
    constructor(timestamp, transactions, hash, prevBlockHash) {
        this.timestamp = timestamp
        this.transactions = transactions
        this.hash = hash
        this.prevBlockHash = prevBlockHash
    }

    setHash() {
        const blockData = this.timestamp + JSON.stringify(this.transactions) + this.prevBlockHash
        const hash = crypto.createHash('sha256');
        hash.update(blockData);
        this.hash = hash.digest('hex');
    }

    toJSON() {
        return {
            timestamp: this.timestamp,
            transactions: this.transactions.map((item) => {
                return item.toJSON()
            }),
            hash: this.hash,
            prevBlockHash: this.prevBlockHash
        }
    }
}

const create = (transactions, prevBlockHash) => {
    const timestamp = moment().unix()
    const block = new Block(timestamp, transactions, '', prevBlockHash)
    return block
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