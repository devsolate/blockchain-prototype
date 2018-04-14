'use strict'

const vorpal = require('vorpal')()
const Blockchain = require('./blockchain')
const Wallet = require('./wallet')
const Hash = require('./utils/hash')
const Verify = require('./utils/verify')

const Command = () => {

    // Blockchain
    vorpal
        .command('init', 'Initialize blockchain')
        .option('-a, --address <address>', 'Wallet Address')
        .action(async (args, callback) => {
            const { address } = args.options
            await blockchainInitCmd(address)
            callback()
        })
    
    vorpal
        .command('list', 'List all block in blockchain db')
        .action(async (args, callback) => {
            await blockchainListCmd()
            callback()
        })
    
    vorpal
        .command('sent', 'Insert data to blockchain')
        .option('-f, --from <from>', 'From Address')
        .option('-t, --to <to>', 'To Address')
        .option('-a, --amount <amount>', 'Amount')
        .action(async (args, callback) => {
            const { from, to, amount } = args.options
            await blockchainSentCmd(from, to, amount)
            callback()
        })

    vorpal
        .command('balance', 'Find balance of wallet address in blockchain')
        .option('-a, --address <address>', 'Wallet Address')
        .action(async (args, callback) => {
            const { address } = args.options
            await blockchainFindBalanceCmd(address)
            callback()
        })

    // Wallet Command
    vorpal
        .command('wallet create', 'Create wallet with private key')
        .option('-p, --password <password>', 'Private Key Password')
        .action(async (args, callback) => {
            const { password } = args.options
            await walletCreateCmd(password)
            callback()
        })
    

    vorpal
        .command('wallet address', 'Get wallet address from private key')
        .option('-k, --key <key>', 'Private Key Path')
        .option('-p, --password <password>', 'Private Key Password')
        .action(async (args, callback) => {
            const { key, password } = args.options
            await walletAddressCmd(key, password)
            callback()
        })

    vorpal
        .command('wallet verify', 'Verify wallet address')
        .option('-a, --address <address>', 'Wallet address')
        .action(async (args, callback) => {
            const { address } = args.options
            await walletVerifyAddressCmd(address)
            callback()
        })
    
    vorpal
        .delimiter('blockchain$')
        .show()
}

const walletCmd = (subcmd, opts) => {
    switch(subcmd) {
        case 'create':
            walletCreateCmd(opts.password)
            return;
        case 'address':
            walletAddressCmd(opts.key, opts.password)
            return;
        case 'sign':
            walletSignCmd(opts.key, opts.password)
            return;
        case 'verify':
            walletVerifyAddressCmd(opts.from)
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

        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
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

        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
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

        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}


const blockchainFindBalanceCmd = async (wallet) => {
    try {
        const bc = await Blockchain.get()
        const balance = await bc.findBalance(wallet)
        console.log(`${wallet} has balance:`, balance)

        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}

const walletCreateCmd = async (password) => {
    try {
        const wallet = await Wallet.create()
        wallet.exportPrivateKey(password)

        console.log("Wallet Created")
        console.log("Address:", wallet.address)
        
        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}

const walletAddressCmd = async (file, password) => {
    try {
        const wallet = await Wallet.load(file, password)
        
        console.log("Wallet is loaded")
        console.log("Address:", wallet.address)
        
        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}


const walletVerifyAddressCmd = async (address) => {
    try {
        const verified = Verify.address(address)
        console.log("Address Verify :", verified)

        return Promise.resolve()
    } catch(error) {
        console.error(error)
        return Promise.reject(error)
    }
}

module.exports = Command