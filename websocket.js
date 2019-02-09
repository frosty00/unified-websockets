let WebSocketClient = require('./websocket-client.js')


class UnifiedWebsocket {
    constructor (uri, protocol = undefined) {
        this.uri = uri
        this.protocol = protocol
        this._connection = undefined
    }

    async connect () {
        if (this._connection !== undefined) {
            return this._connection
        }
        let client = new WebSocketClient ()
        await client.connect (this.uri, [this.protocol])
        this._connection = client
        return this._connection
    }

    async send (data) {
        await this.connect ()
        return this._connection.send (data)
    }

    async recv () {
        await this.connect ()
        return await this._connection.receive ()
    }
}

mysocket = new UnifiedWebsocket ('wss://stream.binance.com:9443/ws/bnbbtc@kline_1d')
;(async () => {
    console.log (await mysocket.recv ())
    process.exit(0)
}) ()
