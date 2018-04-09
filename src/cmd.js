'use strict'

const program = require('commander')
const Blockchain = require('./blockchain')

const init = () => {
    program
        .version('0.1.0')
        .arguments('<cmd> [subcmd]')
        .option('-d, --data [data]', 'Block Data')
        .action((cmd, subcmd, options) => {
            
            if(cmd === 'blockchain') {
                blockchainCmd(subcmd, options)
            }

        });

    program.parse(process.argv)
}

const blockchainCmd = (subcmd, opts) => {
    switch(subcmd) {
        case 'init':
            blockchainInitCmd()
            return;
        case 'list':
            blockchainListCmd()
            return;
        case 'insert':
            blockchainInsertCmd(opts.data)
            return;
        default:
            return;
    }
}

const blockchainInitCmd = async () => {
    Blockchain.init()
}

const blockchainListCmd = async () => {
    console.log("List All Blocks")

    try {
        const bc = await Blockchain.get()
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
    } catch(error) {
        console.log(error)
    }
}

const blockchainInsertCmd = async (data) => {
    try {
        const bc = await Blockchain.get()
        const block = await bc.newBlock(data)

        console.log("Block Created")
        console.log("Data: ", block.data)
        console.log("Hash: ", block.hash)
        console.log("PrevBlockHash: ", block.prevBlockHash)
    } catch(error) {
        console.log(error)
    }
}

module.exports = {
    init
}