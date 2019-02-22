const W3CWebSocket = require('websocket').w3cwebsocket;
const WebSocketAsPromised = require('websocket-as-promised');


function externallyResolvablePromise () {

    let resolve, reject, bogusTimeout

    const p = new Promise ((resolve_, reject_) => {
        resolve = resolve_
        reject = reject_
        bogusTimeout = setTimeout (function () {}, 1000000000) // prevents unwanted process termination when no more event loop tasks left
    })

    p.resolved = false

    p.resolve = function () {
        p.resolved = true
        clearTimeout (bogusTimeout)
        resolve.apply (this, arguments)
    }

    p.reject = function () {
        p.resolved = true
        clearTimeout (bogusTimeout)
        reject.apply (this, arguments)
    }

    return p
}

class UnifiedWebsocket {
    constructor (uri) {
        this._wsp = new WebSocketAsPromised (uri, {
            createWebSocket: url => new W3CWebSocket(url)
        });
        this.ws = this._wsp.ws
        this.queue = []
        this.callbacks = []
        // Translates push style into pull style
        this.addCallback((message) => { if (this.queue.length > 0) { this.queue.shift ().resolve (message)} })
    }

    async isOpen () {
        return this._wsp.isOpened || this._wsp.closing
    }

    async send (data) {
        await this.connect ()
        this._wsp.send (data)
    }

    async recv () {
        await this.connect ()
        let promise = new externallyResolvablePromise ()
        this.queue.push (promise)
        return promise
    }

    async open () {
        if (!this.isOpen ()) {
            return await this._wsp.open()
        }
    }

    addCallback (callback) {
        this.callbacks.push (callback)
        this._wsp.onMessage.addListener (callback)
    }

    async connect () {
        await this._wsp.open()
    }

    async close () {
        await this._wsp.close()
    }
}

const myWs = new UnifiedWebsocket ('wss://stream.binance.com:9443/ws/ethbtc@depth');
myWs.addCallback((msg) => { console.log ("Inside callback: " + msg) })


;(async function foo () {
    await myWs.open ()
    console.log(await myWs.recv ())
    console.log (await myWs.recv ())
    console.log (await myWs.recv ())
    await myWs.close ()
}) ()
