'use strict'

const Hash = require('./utils/hash')
const coinbaseSignature = 'My first coin initialized'

class Transaction {
    constructor(id = '', vin = [], vout = []) {
        this.id = id
        this.vin = vin
        this.vout = vout
    }

    addVin(trxnId, voutIdx, signature) {
        this.vin = [
            ...this.vin,
            {
                id: trxnId,
                vout: voutIdx,
                signature: signature
            }
        ]
    }

    addVout(address, value) {
        this.vout = [
            ...this.vout,
            {
                value: value,
                address: address
            }
        ]
    }

    setID() {
        const trxnData = JSON.stringify({
            vin: this.vin,
            vout: this.vout
        })
        
        this.id = Hash.sha256(trxnData)
    }

    toJSON() {
        return {
            id: this.id,
            vin: this.vin,
            vout: this.vout
        }
    }
}

const create =  async (blockchain, from, to, amount) => {
    try {
        const unused = await findUnusedTransactions(blockchain, from, amount)
        const sum = unused.sum

        if(sum >= amount) {
            const trxn = new Transaction()
            
            for(let key in unused.trxns) {
                const unusedTx = unused.trxns[key]
                trxn.addVin(key, unusedTx.idx, from)
            }

            trxn.addVout(from, sum - amount)    // Sender
            trxn.addVout(to, amount)            // Receiver
            trxn.setID()
            
            return Promise.resolve(trxn)
        } else {
            return Promise.reject("Insufficient amount")
        }
    } catch(error) {
        return Promise.reject(error)
    }
}

const findUnusedTransactions = async (bc, address, amount = -1) => {
    const iterator = bc.getIterator()
    const result = filterUnusedTransactions(iterator, address, amount)
    return Promise.resolve(result)
}

const filterUnusedTransactions = (iterator, address, amount = -1) => {
    return new Promise(async(resolve, reject) => {
        let sum = 0
        let usedTrxns = {}
        let unusedTrxns = {}

        while (true) {

            // Loop though all block in blockchain
            const next = await iterator.next()
            if (next) {
                next.transactions.map((trxn) => {

                    // Mask Vin Trxn as Used Trxns
                    trxn.vin.map((vinTrxn) => {

                        // Only Target Address Filter
                        if(address == vinTrxn.signature) {
                            usedTrxns[vinTrxn.id] = {
                                id: vinTrxn.id,
                                voutIdx: vinTrxn.vout
                            }
                        }
                    })

                    trxn.vout.map((vout, voutIdx) => {
                        if(!usedTrxns[trxn.id]) {
                            if(address == vout.address) {
                                unusedTrxns[trxn.id] = {
                                    idx: voutIdx,
                                    value: vout.value
                                }

                                sum += vout.value
                            }
                        }
                    })
                })
            } else {
                break;
            }
        }

        return resolve({
            sum: sum,
            trxns: unusedTrxns
        })
    })
}

const coinbase = (to, amount) => {
    const trxn = new Transaction()
    trxn.addVin('', -1, coinbaseSignature)
    trxn.addVout(to, amount)
    trxn.setID()

    return trxn
}

module.exports = {
    create,
    coinbase,
    findUnusedTransactions
}
