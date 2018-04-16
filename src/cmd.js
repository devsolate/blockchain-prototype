'use strict'

const vorpal = require('vorpal')()

const Command = (bc) => {

    vorpal
        .command('init', 'Initialize blockchain')
        .option('-a, --address <address>', 'Wallet Address')
        .action(async (args, callback) => {
            const { address } = args.options
            await blockchainInitCmd(bc, address)
            callback()
        })
    
    vorpal
        .command('list', 'List all block in blockchain db')
        .action(async (args, callback) => {
            await blockchainListCmd(bc)
            callback()
        })

    vorpal
        .command('mine', 'Mine new block in blockchain')
        .action(async (args, callback) => {
            await blockchainMineCmd(bc)
            callback()
        })
    
    vorpal
        .command('sent', 'Insert data to blockchain')
        .option('-f, --from <from>', 'From Address')
        .option('-t, --to <to>', 'To Address')
        .option('-a, --amount <amount>', 'Amount')
        .action(async (args, callback) => {
            const { from, to, amount } = args.options
            await blockchainSentCmd(bc, from, to, amount)
            callback()
        })

    vorpal
        .command('balance', 'Find balance of wallet address in blockchain')
        .option('-a, --address <address>', 'Wallet Address')
        .action(async (args, callback) => {
            const { address } = args.options
            await blockchainFindBalanceCmd(bc, address)
            callback()
        })

    vorpal
        .delimiter('blockchain$')
        .show()

    return vorpal
}

const blockchainInitCmd = async (bc, to) => {
    try {
        const block = await bc.init(to)

        console.log("Genesis Block Created")
        console.log("Transactions: ", block.transactions)
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
        console.log("List All Blocks")

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
        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}

const blockchainSentCmd = async (bc, from, to, amount = '0') => {
    try {
        const amountInt = parseInt(amount)
        const trxn = await bc.createTrxn(from, to, amountInt)
        
        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}

const blockchainMineCmd = async (bc) => {
    try {
        const block = await bc.mine()

        console.log("Block Created")
        console.log("Transactions: ", block.transactions)
        console.log("Hash: ", block.hash)
        console.log("PrevBlockHash: ", block.prevBlockHash)

        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}


const blockchainFindBalanceCmd = async (bc, wallet) => {
    try {
        const balance = await bc.findBalance(wallet)
        console.log(`${wallet} has balance:`, balance)

        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}

module.exports = Command