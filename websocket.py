import websockets
import asyncio


class UnifiedWebsocket:
    def __init__(self, uri, protocol=None):
        self.uri = uri
        self.protocol = protocol
        self._connection = None
        self.callbacks = []
        self.ws = websockets.connect(self.uri, subprotocols=self.protocol)
        asyncio.ensure_future(self.callbackLoop())
        self.lastFuture = None
        self.loop = asyncio.get_event_loop()  # should be able to pass it
        self.lock = asyncio.Lock()

    async def open(self):
        async with self.lock:
            if self._connection is not None:
                return self._connection
            self._connection = await self.ws.__aenter__()
            return self._connection

    async def send(self, data):
        await self.open()
        return await self._connection.send(data)

    async def recv(self):
        await self.open()
        return await self.lastFuture

    def isOpen(self):
        return self._connection is not None and self._connection.open

    def addCallback(self, callback):
        self.callbacks.append(callback)

    async def close(self):
        async with self.lock:
            await self._connection.close()
            await self.ws.__aexit__(None, None, None)

    async def callbackLoop(self):
        """Translates pull style into push style"""
        await self.open()
        while True:
            async with self.lock:
                if self.isOpen():
                    self.lastFuture = loop.create_task(self._connection.recv())
                    msg = await self.lastFuture
                    for callback in self.callbacks:
                        callback(msg)
                else:
                    break


def onMessage(msg):
    print('inside callback: ' + msg)


myWs = UnifiedWebsocket('wss://stream.binance.com:9443/ws/ethbtc@kline_1d')
myWs.addCallback(onMessage)


async def test ():
    await myWs.open()
    print(await myWs.recv())
    print(await myWs.recv())
    print(await myWs.recv())
    await myWs.close()


loop = asyncio.get_event_loop()
asyncio.ensure_future(test(), loop=loop)
loop.run_forever()