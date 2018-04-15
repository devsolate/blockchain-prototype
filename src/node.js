'use strict'

const {
    P2PNode
} = require('p2p-connect')
const host = 'http://localhost:9000'

const Blockchain = require('./blockchain')
const Command = require('./cmd')
const pull = require('pull-stream')

const channel = {
    SYNC_REQUEST: 'SYNC_REQUEST',
    SYNC_BLOCK: 'SYNC_BLOCK',
    CREATED_TRANSACTION: 'CREATE TRANSACTION',
    CREATED_BLOCK: 'MINED A NEW BLOCK'
}

const start = async () => {
    const bc = await Blockchain.get()
    const node = new P2PNode(host)
    await node.start()
    
    const cmd = Command(node)

    // Subscribe data from other node
    node.subscribe(channel.SYNC_REQUEST, async (buffer) => {
        const data = JSON.parse(buffer.data.toString())
        const currentNodeId = node.node.peerInfo.id.toB58String()
        
        // Request Sync from Other Node
        if(data.nodeId != currentNodeId) {
            const block = await bc.findNext(data.latestHash)

            if(block) {
                node.publish(channel.SYNC_BLOCK, JSON.stringify({
                    nodeId: data.nodeId,
                    block: block.toJSON()
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

            setTimeout(() => {
                node.publish(channel.SYNC_REQUEST, JSON.stringify({
                    nodeId: currentNodeId,
                    latestHash: data.block.hash,
                }))
            }, 2000)
        }
    })

    node.subscribe(channel.CREATED_TRANSACTION, (transaction) => {

    })

    node.subscribe(channel.CREATED_BLOCK, (block) => {
        
    })

    // Call sync when connect other peer
    node.node.on('peer:connect', (peer) => {
        setTimeout(() => {
            sync(node, bc)
        }, 2000)
    })
}

const sync = async(node, bc) => {
    const latestHash = await bc.getLatestHash()
    const nodeId = node.node.peerInfo.id.toB58String()

    node.publish(channel.SYNC_REQUEST, JSON.stringify({
        nodeId: nodeId,
        latestHash: latestHash,
    }))
}

module.exports = {
    start
}