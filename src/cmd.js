'use strict'

const program = require('commander')
const Blockchain = require('./blockchain')
const Wallet = require('./wallet')

const init = () => {
    program
        .version('0.1.0')
        .arguments('<cmd> [subcmd]')
        .option('-d, --data [data]', 'Block Data')
        .option('-f, --from [from]', 'From Address')
        .option('-t, --to [to]', 'Receive Address')
        .option('-a, --amount [amount]', 'Amount')
        .option('-w, --wallet [wallet]', 'Wallet Address')
        .option('-p, --password [password]', 'Password')
        .option('-k, --key [key]', 'Private Key File')
        .action((cmd, subcmd, options) => {

            switch(cmd) {
                case 'blockchain':
                    blockchainCmd(subcmd, options)
                    return
                case 'wallet':
                    walletCmd(subcmd, options)
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

const walletCmd = (subcmd, opts) => {
    switch(subcmd) {
        case 'create':
            walletCreateCmd(opts.password)
            return;
        case 'address':
            walletAddressCmd(opts.key, opts.password)
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

const walletCreateCmd = async (password) => {
    try {
        const wallet = await Wallet.create(password)
        wallet.exportPrivateKey()
        console.log("Wallet Created")
        console.log("Address:", wallet.getWalletAddress())
    } catch(error) {
        console.log(error)
    }
}

const walletAddressCmd = async (file, password) => {
    try {
        const wallet = await Wallet.load(file, password)
        
        console.log("Private Key are loaded")
        console.log("Address:", wallet.getWalletAddress())
    } catch(error) {
        console.error(error)
    }
}

module.exports = {
    init
}