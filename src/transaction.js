'use strict'

const Hash = require('./utils/hash')
const Verify = require('./utils/verify')
const Wallet = require('./wallet')
const coinbaseSignature = 'My first coin initialized'

class Transaction {
    constructor(id = '', vin = [], vout = []) {
        this.id = id
        this.vin = vin
        this.vout = vout
    }

    addVin(trxnId, voutIdx, signature, pubKey) {
        this.vin = [
            ...this.vin,
            {
                id: trxnId,
                vout: voutIdx,
                signature: signature,
                scriptPubKey: pubKey
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

    verify() {
        if(isCoinbaseTrxn(this)) {
            return true
        }

        let isVerify = true
        for(let i = 0; i < this.vin.length; i++) {
            const vin = this.vin[i]
            const verify = Verify.sign(vin.scriptPubKey, vin.id, vin.signature)
            if(!verify) {
                isVerify = false
                break;
            }
        }

        return isVerify
    }
}

const isCoinbaseTrxn = (trxn) => {
    return trxn.vin.length == 1 && trxn.vin[0].signature == coinbaseSignature
}

const create =  async (blockchain, wallet, to, amount) => {
    try {
        const from = wallet.address
        const unused = await findUnusedTransactions(blockchain, from, amount)
        const sum = unused.sum

        if(sum >= amount) {
            const trxn = new Transaction()
            
            for(let key in unused.trxns) {
                const unusedTx = unused.trxns[key]
                const signature = wallet.sign(key)
                trxn.addVin(key, unusedTx.idx, signature, wallet.publicKey)
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
    try {
        const iterator = bc.getIterator()
        const pendingTrxns = await bc.getTransactions()
        const result = filterUnusedTransactions(iterator, pendingTrxns, address, amount)
        return Promise.resolve(result)
    } catch(error) {
        return Promise.reject(error)
    }
}

const filterUnusedTransactions = (iterator, pendingTrxns, address, amount = -1) => {
    return new Promise(async(resolve, reject) => {
        let sum = 0
        let usedTrxns = {}
        let unusedTrxns = {}

        // Add pending trxns to used
        pendingTrxns.map((trxn) => {
            trxn.vin.map((vinTrxn) => {
                if (address == vinTrxn.signature) {
                    usedTrxns[vinTrxn.id] = {
                        id: vinTrxn.id,
                        voutIdx: vinTrxn.vout
                    }
                }
            })
        })


        while (true) {

            // Loop though all block in blockchain
            const next = await iterator.next()
            if (next) {
                next.transactions.map((trxn) => {


                    if(!isCoinbaseTrxn(trxn)) {

                        // Mask Vin Trxn as Used Trxns
                        trxn.vin.map((vinTrxn) => {

                            // Only Target Address Filter
                            if(address == Wallet.getAddress(vinTrxn.scriptPubKey)) {
                                usedTrxns[vinTrxn.id] = {
                                    id: vinTrxn.id,
                                    voutIdx: vinTrxn.vout
                                }
                            }
                        })
                    }

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
    findUnusedTransactions,
    instance: Transaction
}
