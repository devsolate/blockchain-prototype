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
        .option('-w, --wallet [wallet]', 'Wallet Address')
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
            blockchainInitCmd(opts.to)
            return;
        case 'list':
            blockchainListCmd()
            return;
        case 'sent':
            blockchainSentCmd(opts.from, opts.to, opts.amount)
            return;
        case 'balance':
            blockchainFindBalanceCmd(opts.wallet)
            return;
        default:
            return;
    }
}

const blockchainInitCmd = async (to) => {
    try {
        const block = await Blockchain.init(to)

        console.log("Genesis Block Created")
        console.log("Transactions: ", block.transactions)
        console.log("Hash: ", block.hash)
        console.log("PrevBlockHash: ", block.prevBlockHash)
    } catch(error) {
        console.error(error)
    }
}

const blockchainListCmd = async () => {
    try {
        console.log("List All Blocks")
    
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
        console.error(error)
    }
}

const blockchainSentCmd = async (from, to, amount = '0') => {
    try {
        const amountInt = parseInt(amount)
        const bc = await Blockchain.get()
        const trxn = await bc.createTrxn(from, to, amountInt)
        const block = await bc.mine()

        console.log("Block Created")
        console.log("Transactions: ", block.transactions)
        console.log("Hash: ", block.hash)
        console.log("PrevBlockHash: ", block.prevBlockHash)

    } catch(error) {
        console.error(error)
    }
}


const blockchainFindBalanceCmd = async (wallet) => {
    try {
        const bc = await Blockchain.get()
        const balance = await bc.findBalance(wallet)
        console.log(`${wallet} has balance:`, balance)

    } catch(error) {
        console.error(error)
    }
}

module.exports = {
    init
}