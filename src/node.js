'use strict'

const {
    P2PNode
} = require('p2p-connect')
const host = 'http://localhost:9000'
const inquirer = require('inquirer');

const start = async () => {
    const node = new P2PNode(host)
    await node.start()

    command()
}

const command = () => {
    const questions = [{
        type: 'confirm',
        name: 'toBeDelivered',
        message: 'Is this for delivery?',
        default: false
    }]

    inquirer.prompt(questions).then(answers => {
        console.log(JSON.stringify(answers, null, '  '));

        command()
    });
}

start()