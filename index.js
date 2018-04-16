'use strict'

const Command = require('./src/cmd')
const Blockchain = require('./src/blockchain')

const start = async () => {
    try {
        const bc = new Blockchain()
        await bc.connect()

        Command(bc)
    } catch(error) {
        console.log(error)
    }
}

start()