'use strict'

const program = require('commander')
const Blockchain = require('./blockchain')

function init() {
    program
        .version('0.1.0')
        .arguments('<cmd> [subcmd]')
        .option('-d, --data [data]', 'Block Data')
        .action(async(cmd, subcmd, options) => {
            
            if(cmd === 'blockchain') {
                if(subcmd === 'init') {
                    Blockchain.init()
                }
                if(subcmd === 'list') {
                    console.log("List All Blocks")
                    const bc = await Blockchain.get()
                    bc.traverse()
                }
                if(subcmd === 'insert') {
                    const bc = await Blockchain.get()
                    const block = await bc.newBlock(options.data)

                    console.log("Block Created")
                    console.log("Data: ", block.data)
                    console.log("Hash: ", block.hash)
                    console.log("PrevBlockHash: ", block.prevBlockHash)
                }
            }
        });

    program.parse(process.argv)
}

module.exports = {
    init
}