'use strict'

const moment = require('moment')
const Hash = require('./utils/hash')
const genesisBlockSignature = "It's a start point of everything"


class Block {
    constructor(timestamp, data, hash, prevBlockHash) {
        this.timestamp = timestamp
        this.data = data
        this.hash = hash
        this.prevBlockHash = prevBlockHash
    }

    setHash() {
        const data = this.timestamp + this.data + this.prevBlockHash
        this.hash = Hash.sha256(data)
    }

    toJSON() {
        return {
            timestamp: this.timestamp,
            data: this.data,
            hash: this.hash,
            prevBlockHash: this.prevBlockHash
        }
    }
}

const create = (data, prevBlockHash) => {
    const timestamp = moment().unix()
    const block = new Block(timestamp, data, '', prevBlockHash)
    return block
}

const createGenesisBlock = () => {
    const block = create(genesisBlockSignature, '')
    return block
}

module.exports = {
    create,
    createGenesisBlock
}