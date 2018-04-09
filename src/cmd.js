'use strict'

const program = require('commander')
const Blockchain = require('./blockchain')

const init = () => {
    program
        .version('0.1.0')
        .arguments('<cmd> [subcmd]')
        .option('-d, --data [data]', 'Block Data')
        .option('-f, --from [from]', 'From Address')
        .option('-t, --to [to]', 'Receive Address')
        .option('-a, --amount [amount]', 'Amount')
        .action((cmd, subcmd, options) => {

            switch(cmd) {
                case 'blockchain':
                    blockchainCmd(subcmd, options)
                    return
                default:
                    return
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
        case 'sent':
            blockchainSentCmd(opts.from, opts.to, opts.amount)
            return;
        case 'balance':
            blockchainFindBalanceCmd(opts.from)
            return;
        default:
            return;
    }
}

const blockchainInitCmd = async () => {
    const block = await Blockchain.init()

    console.log("Genesis Block Created")
    console.log("Transactions: ", block.transactions)
    console.log("Hash: ", block.hash)
    console.log("PrevBlockHash: ", block.prevBlockHash)
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
                console.log("Transactions: ", next.transactions)
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

const blockchainSentCmd = async (from, to, amount) => {
    try {
        const bc = await Blockchain.get()
        const trxn = await bc.createTrxn(from, to, amount)
        const block = await bc.mine()

        console.log("Block Created")
        console.log("Transactions: ", block.transactions)
        console.log("Hash: ", block.hash)
        console.log("PrevBlockHash: ", block.prevBlockHash)
    } catch(error) {
        console.log(error)
    }
}


const blockchainFindBalanceCmd = async (from) => {
    try {
        const bc = await Blockchain.get()
        const balance = await bc.findBalance(from)
        console.log(balance)
    } catch(error) {
        console.log(error)
    }
}

module.exports = {
    init
}