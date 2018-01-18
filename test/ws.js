#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

const connect=()=>client.connect('wss://stream.binance.com:9443/ws/!ticker@arr' );

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
        connect();
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
        connect();
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'\n");
        }
    });

    function sendNumber() {
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            connection.sendUTF(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    // sendNumber();
});

// client.connect('wss://stream.binance.com:9443/ws/!ticker@arr', 'echo-protocol');
connect();