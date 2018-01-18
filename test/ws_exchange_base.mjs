// const _ = require('lodash')
import Debug from 'debug'
import WebSocket from 'websocket' ;

const debug = Debug('WebSockectExchange');

const {client: WebSocketClient} = WebSocket

export default class WebSockect {

    constructor(options) {
        this.endPoint = '';
        this.autoReconnect = true;
        this.keepAlive = true;
        Object.assign(this, {
            endPoint: '',
            autoReconnect: true,
            keepAlive: false,
        }, options);

        if (!this.endPoint) {
            throw new Error("WebSocket endpoint is undefined")
        }
    }

    connect() {
        const client = this.client = new WebSocketClient();

        const connect = () => client.connect(this.endPoint);

        client.on('connectFailed', (error) => {
            debug('Connect Error: ' + error.toString());
            this.onConnectFailed()
        });

        client.on('connect', (connection) => {
            debug('WebSocket Client Connected');
            this.connection = connection;
            this.onConnect()
            connection.on('error', (error) => {
                this.onConnectionError(error)
                debug("Connection Error: " + error.toString());
                this.autoReconnect && this.connect();
            });
            connection.on('close', () => {
                debug('echo-protocol Connection Closed');
                this.onConnectionClose()
                this.autoReconnect && this.connect();
            });
            this.onConnect();
            connection.on('message', (message) => {
                this.onRawMessage(message)
                if (message.type === 'utf8') {
                    debug("Received: '" + message.utf8Data + "'\n");
                    this.onJSONMessage(JSON.parse(message.utf8Data))
                }
            });
            this.keepAlive && this.sendKeepAliveMsg()
        });

        connect();
    }

    sendKeepAliveMsg() {
        if (this.connection.connected) {
            let number = Math.round(Math.random() * 0xFFFFFF);
            this.connection.sendUTF(number.toString());
            setTimeout(this.keepAlive, 1000);
        }
    }

    onConnect() {

    }

    onRawMessage() {

    }

    onJSONMessage() {

    }

    onConnectionClose() {

    }

    onConnectionError(error) {

    }

    onConnectFailed() {

    }

}