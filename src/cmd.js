'use strict'

const vorpal = require('vorpal')()

const Command = (bc) => {
    vorpal
        .command('init', 'Initialize blockchain')
        .action(async (args, callback) => {
            await blockchainInitCmd(bc)
            callback()
        });
    
    vorpal
        .command('list', 'List all block in blockchain db')
        .action(async (args, callback) => {
            await blockchainListCmd(bc)
            callback()
        });
    
    vorpal
        .command('insert', 'Insert data to blockchain')
        .option('-d, --data <data>', 'Data')
        .action(async (args, callback) => {
            const data = args.options.data
            await blockchainInsertCmd(bc, data)
            callback()
        });

    vorpal
        .delimiter('blockchain$')
        .show()
}

const blockchainInitCmd = async (bc) => {
    try {
        const block = await bc.init()

        console.log("Genesis Block Created")
        console.log("Data: ", block.data)
        console.log("Hash: ", block.hash)
        console.log("PrevBlockHash: ", block.prevBlockHash)

        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}

const blockchainListCmd = async (bc) => {
    try {
        const iterator = bc.getIterator()

        while (true) {
            const next = await iterator.next()
            if(next) {
                console.log("")
                console.log("Data: ", next.data)
                console.log("Hash: ", next.hash)
                console.log("PrevBlockHash: ", next.prevBlockHash)
            } else {
                break;
            }
        }
        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}

const blockchainInsertCmd = async (bc, data) => {
    try {
        const block = await bc.mine(data)

        console.log("Block Created")
        console.log("Data: ", block.data)
        console.log("Hash: ", block.hash)
        console.log("PrevBlockHash: ", block.prevBlockHash)

        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}

module.exports = Command