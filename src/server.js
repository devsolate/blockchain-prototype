'use strict'

const { P2PServer } = require('p2p-connect')
const app = P2PServer(9000, './node.db')