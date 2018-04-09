'use strict'

const moment = require('moment')
const crypto = require('crypto');
const genesisBlockSignature = "It's a start point of everything"


class Block {
    constructor(timestamp, data, hash, prevBlockHash) {
        this.timestamp = timestamp
        this.data = data
        this.hash = hash
        this.prevBlockHash = prevBlockHash
    }

    setHash() {
        const blockData = this.timestamp + this.data + this.prevBlockHash
        const hash = crypto.createHash('sha256');
        hash.update(blockData);
        this.hash = hash.digest('hex');
    }

    toString() {
        return JSON.stringify({
            timestamp: this.timestamp,
            data: this.data,
            hash: this.hash,
            prevBlockHash: this.prevBlockHash
        })
    }
}

const create = (data, prevBlockHash) => {
    const timestamp = moment().unix()
    const block = new Block(timestamp, data, '', prevBlockHash)
    
    // Set Block Hash
    block.setHash()
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