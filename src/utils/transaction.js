'use strict'

const findUnused = (iterator, address) => {
    return new Promise(async(resolve, reject) => {
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
                            }
                        }
                    })
                })
            } else {
                break;
            }
        }

        return resolve(unusedTrxns)
    })
}

const getBalance = (unusedTrxns) => {
    let sum = 0
    for(let key in unusedTrxns) {
        const trxn = unusedTrxns[key]
        sum += trxn.value
    }
    return sum
}

const getTrxnInputsFormat = (unusedTrxns, from) => {
    let inputs = []
    for(let key in unusedTrxns) {
        const trxn = unusedTrxns[key]
        inputs = [
            ...inputs,
            {
                id: key,
                vout: trxn.idx,
                signature: from
            }
        ]
    }
    return inputs
}

module.exports = {
    findUnused,
    getBalance,
    getTrxnInputsFormat
}