'use strict'

const Blockchain = require('./src/blockchain')
const Command = require('./src/cmd')

const start = async () => {
    try {
        const bc = await Blockchain.get()
        Command(bc)
    } catch(error) {
        console.log(error)
    }
}

start()