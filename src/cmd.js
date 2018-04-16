'use strict'

const vorpal = require('vorpal')()
const Blockchain = require('./blockchain')
const Wallet = require('./wallet')
const Hash = require('./utils/hash')
const Verify = require('./utils/verify')

const Command = (bc, p2pNode) => {
    // Blockchain
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
        .command('sent', 'Sent coin to other address')
        .option('-k, --key <key>', 'Private Key Path')
        .option('-p, --password <password>', 'Private Key Password')
        .option('-t, --to <to>', 'To Address')
        .option('-a, --amount <amount>', 'Amount')
        .action(async (args, callback) => {
            const { key, password, to, amount } = args.options
            await blockchainSentCmd(bc, key, password, to, amount, p2pNode)
            callback()
        })
    

    vorpal
        .command('mine', 'Mine a new block')
        .action(async (args, callback) => {
            const block = await blockchainMineBlockCmd(bc)

            p2pNode.publish('CREATED_BLOCK', JSON.stringify(block))
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

    // Wallet Command
    vorpal
        .command('wallet create', 'Create wallet with private key')
        .option('-p, --password <password>', 'Private Key Password')
        .action(async (args, callback) => {
            const { password } = args.options
            await walletCreateCmd(bc, password)
            callback()
        })
    

    vorpal
        .command('wallet address', 'Get wallet address from private key')
        .option('-k, --key <key>', 'Private Key Path')
        .option('-p, --password <password>', 'Private Key Password')
        .action(async (args, callback) => {
            const { key, password } = args.options
            await walletAddressCmd(bc, key, password)
            callback()
        })

    vorpal
        .command('wallet verify', 'Verify wallet address')
        .option('-a, --address <address>', 'Wallet address')
        .action(async (args, callback) => {
            const { address } = args.options
            await walletVerifyAddressCmd(bc, address)
            callback()
        })
    
    vorpal
        .delimiter('blockchain$')
        .show()

    return vorpal
}

const blockchainInitCmd = async (bc, to) => {
    try {
        const block = await Blockchain.init(to)

        console.log("Genesis Block Created")
        console.log("Transactions: ", block.transactions)
        console.log("Hash: ", block.hash)
        console.log("PrevBlockHash: ", block.prevBlockHash)

        return Promise.resolve()
    } catch (error) {
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
            if (next) {
                console.log("")
                console.log("Transactions: ", next.transactions)
                console.log("Hash: ", next.hash)
                console.log("PrevBlockHash: ", next.prevBlockHash)
            } else {
                break;
            }
        }
        
        return Promise.resolve()
    } catch (error) {
        console.error(error)
        return Promise.reject(error)
    }
}

const blockchainMineBlockCmd = async (bc, p2pNode) => {
    try {
        console.log("Mining Block")
        const block = await bc.mine()

        console.log("Block Created")
        console.log("Transactions: ", block.transactions)
        console.log("Hash: ", block.hash)
        console.log("PrevBlockHash: ", block.prevBlockHash)
        
        return Promise.resolve(block)
    } catch (error) {
        console.error(error)
        return Promise.reject(error)
    }
}

const blockchainSentCmd = async (bc, key, password, to, amount = '0', p2pNode) => {
    try {
        const amountInt = parseInt(amount)
        if (Verify.address(to)) {
            const wallet = await Wallet.load(key, password)
            const trxn = await bc.createTrxn(wallet, to, amountInt)

            p2pNode.publish('CREATED_TRANSACTION', JSON.stringify(trxn))

            console.log("Transactions Created")
        } else {
            console.log("Wallet address is invalid")
        }

        return Promise.resolve()
    } catch (error) {
        console.error(error)
        return Promise.reject(error)
    }
}


const blockchainFindBalanceCmd = async (bc, wallet) => {
    try {
        if (Verify.address(wallet)) {
            const balance = await bc.findBalance(wallet)
            console.log(`${wallet} has balance:`, balance)
        } else {
            console.log("Wallet address is invalid")
        }

        return Promise.resolve()
    } catch (error) {
        console.error(error)
        return Promise.reject(error)
    }
}

const walletCreateCmd = async (bc, password) => {
    try {
        const wallet = await Wallet.create()
        wallet.exportPrivateKey(password)

        console.log("Wallet Created")
        console.log("Address:", wallet.address)

        return Promise.resolve()
    } catch (error) {
        console.error(error)
        return Promise.reject(error)
    }
}

const walletAddressCmd = async (bc, file, password) => {
    try {
        const wallet = await Wallet.load(file, password)

        console.log("Wallet is loaded")
        console.log("Address:", wallet.address)

        return Promise.resolve()
    } catch (error) {
        console.error(error)
        return Promise.reject(error)
    }
}


const walletVerifyAddressCmd = async (bc, address) => {
    try {
        const verified = Verify.address(address)
        console.log("Address Verify :", verified)

        return Promise.resolve()
    } catch (error) {
        console.error(error)
        return Promise.reject(error)
    }
}

module.exports = Command