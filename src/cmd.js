'use strict'

const program = require('commander')
const Blockchain = require('./blockchain')
const Wallet = require('./wallet')
const Hash = require('./utils/hash')
const Verify = require('./utils/verify')

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
        const wallet = await Wallet.create()
        wallet.exportPrivateKey(password)

        console.log("Wallet Created")
        console.log("Address:", wallet.address)
    } catch(error) {
        console.log(error)
    }
}

const walletAddressCmd = async (file, password) => {
    try {
        const wallet = await Wallet.load(file, password)
        
        console.log("Wallet is loaded")
        console.log("Address:", wallet.address)
        console.log(wallet.publicKey)
    } catch(error) {
        console.error(error)
    }
}


const walletVerifyAddressCmd = async (address) => {
    try {
        const verified = Verify.address(address)
        console.log("Address Verify :", verified)

    } catch(error) {
        console.error(error)
    }
}

const walletSignCmd = async (file, password) => {
    try {
        const wallet = await Wallet.load(file, password)
        const signed = wallet.sign('airichan')

        console.log("Private Key")
        console.log("Signature:", signed)

        const verified = Verify.sign(wallet.publicKey, 'airichan', signed)
        console.log("verify", verified)

    } catch(error) {
        console.error(error)
    }
}

module.exports = {
    init
}