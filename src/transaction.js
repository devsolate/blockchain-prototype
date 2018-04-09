'use strict'

const crypto = require('crypto')
const coinbaseSignature = 'My first coin initialized'

class Transaction {
    constructor(id, vin = [], vout = []) {
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
        const hash = crypto.createHash('sha256');
        hash.update(trxnData);
        this.id = hash.digest('hex');
    }

    toJSON() {
        return {
            id: this.id,
            vin: this.vin,
            vout: this.vout
        }
    }
}

const create = (vins, vouts) => {
    const trxn = new Transaction('')

    vins.map((vin) => {
        trxn.addVin(vin.id, vin.vout, vin.signature)
    })
    
    vouts.map((vout) => {
        trxn.addVout(vout.address, vout.value)
    });
    trxn.setID()

    return trxn
}

const coinbase = (to, amount) => {
    const trxn = new Transaction('')
    trxn.addVin('', -1, coinbaseSignature)
    trxn.addVout(to, amount)
    trxn.setID()

    return trxn
}

module.exports = {
    create,
    coinbase
}
