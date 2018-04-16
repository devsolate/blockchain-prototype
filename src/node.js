'use strict'

const {
    P2PNode
} = require('p2p-connect')

const Blockchain = require('./blockchain')
const Command = require('./cmd')

const channel = {
    SYNC_REQUEST: 'SYNC_REQUEST',
    SYNC_BLOCK: 'SYNC_BLOCK',
    SYNC_TRXN_REQUEST: 'SYNC_TRXN_REQUEST',
    SYNC_TRXN: 'SYNC_TRXN',
    CREATED_TRANSACTION: 'CREATED_TRANSACTION',
    CREATED_BLOCK: 'CREATED_BLOCK'
}

const start = async () => {
    const bc = await Blockchain.get()
    const node = new P2PNode()
    await node.start()
    
    const cmd = Command(bc, node)
    
    console.log("Node Started: ", node.node.peerInfo.id.toB58String())

    // Subscribe data from other node
    node.subscribe(channel.SYNC_REQUEST, async (buffer) => {
        const data = JSON.parse(buffer.data.toString())
        const currentNodeId = node.node.peerInfo.id.toB58String()
        
        // Request Sync from Other Node
        if(data.nodeId != currentNodeId) {
            const block = await bc.findNext(data.latestHash)
            console.log(`Request block ${data.latestHash}`, block)

            if(block) {
                node.publish(channel.SYNC_BLOCK, JSON.stringify({
                    nodeId: data.nodeId,
                    block: block
                }))
            }
        }
    })

    node.subscribe(channel.SYNC_BLOCK, async (buffer) => {
        const data = JSON.parse(buffer.data.toString())
        const currentNodeId = node.node.peerInfo.id.toB58String()
        if(data.nodeId == currentNodeId) {
            await bc.saveBlock(data.block)
            await bc.saveLatestHash(data.block.hash)
            await bc.clearSuccessTransactions(data.block.transactions)

            setTimeout(() => {
                node.publish(channel.SYNC_REQUEST, JSON.stringify({
                    nodeId: currentNodeId,
                    latestHash: data.block.hash,
                }))
            }, 2000)
        }
    })

    node.subscribe(channel.SYNC_TRXN_REQUEST, async (buffer) => {
        const data = JSON.parse(buffer.data.toString())
        const currentNodeId = node.node.peerInfo.id.toB58String()
        
        // Request Sync from Other Node
        if(data.nodeId != currentNodeId) {
            const transactions = await bc.getTransactions()

            if(transactions.length > 0) {
                node.publish(channel.SYNC_TRXN, JSON.stringify({
                    nodeId: data.nodeId,
                    transactions: transactions
                }))
            }
        }
    })

    node.subscribe(channel.SYNC_TRXN, async (buffer) => {
        const data = JSON.parse(buffer.data.toString())
        const currentNodeId = node.node.peerInfo.id.toB58String()

        if(data.nodeId == currentNodeId) {
            data.transactions.map(async (item) => {
                try {
                    await bc.saveTransaction(item)
                } catch(error) {

                }
            })
        }
    })

    node.subscribe(channel.CREATED_TRANSACTION, async (buffer) => {
        const data = JSON.parse(buffer.data.toString())
        
        try {
            await bc.saveTransaction(data)
            console.log("Received broadcast transaction")
        } catch(error) {

        }
    })

    node.subscribe(channel.CREATED_BLOCK, (buffer) => {
        const data = JSON.parse(buffer.data.toString())
        
        syncBlockchain(node, bc)
    })

    // Call sync when connect other peer
    node.node.on('peer:connect', (peer) => {
        setTimeout(() => {
            syncBlockchain(node, bc)
            syncTransaction(node, bc)
        }, 2000)
    })
}

const syncBlockchain = async(node, bc) => {
    const latestHash = await bc.getLatestHash()
    const nodeId = node.node.peerInfo.id.toB58String()

    node.publish(channel.SYNC_REQUEST, JSON.stringify({
        nodeId: nodeId,
        latestHash: latestHash,
    }))
}

const syncTransaction = async(node, bc) => {
    const nodeId = node.node.peerInfo.id.toB58String()
    node.publish(channel.SYNC_TRXN_REQUEST, JSON.stringify({
        nodeId: nodeId
    }))
}

module.exports = {
    start
}