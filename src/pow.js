
'use strict'

const bigInt = require('big-integer')
const Hash = require('./utils/hash')
const complex = 12

class ProofOfWork {
    constructor(block) {
        this.block = block
        this.target = bigInt(1).shiftLeft(256-complex)
    }

    async run() {
        console.time("mining time");

        const data = this.block.timestamp + JSON.stringify(this.block.transactions) + this.block.prevBlockHash + this.block.nonce

        let nonce = 0
        let verifiedHash = ''
        while(true) {
            const hash = Hash.sha256(data + nonce)
            const hashInt = bigInt(hash, 16);

            if(hashInt.compare(this.target) == -1) {
                verifiedHash = hash
                break;
            }
            
            nonce++
        }

        console.timeEnd("mining time");

        return Promise.resolve({
            hash: verifiedHash,
            nonce: nonce
        })
    }
}

const create = (block) => {
    return new ProofOfWork(block)
}

module.exports = {
    create
}