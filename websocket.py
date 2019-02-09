import websockets


class UnifiedWebsocket:
    def __init__(self, uri, protocol=None):
        self.uri = uri
        self.protocol = protocol
        self._connection = None

    async def connect(self):
        if self._connection is not None:
            return self._connection
        context = websockets.connect(self.uri, subprotocols=self.protocol)
        self._connection = await context.__aenter__()
        return self._connection

    async def send(self, data):
        await self.connect()
        return await self._connection.send(data)

    async def recv(self, data):
        await self.connect()
        return await self._connection.recv(data)