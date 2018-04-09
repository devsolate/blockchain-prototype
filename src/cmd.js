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
                }
            }
            if(cmd === 'block') {
                if(subcmd === 'new') {
                    console.log("New Block")
                }
            }
        });

    program.parse(process.argv)
}

module.exports = {
    init
}