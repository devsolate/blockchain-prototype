'use strict'

const {
    P2PNode
} = require('p2p-connect')
const host = 'http://localhost:9000'
const Command = require('./cmd')

const start = async () => {
    const node = new P2PNode(host)
    await node.start()

    Command()
}

module.exports = {
    start
}