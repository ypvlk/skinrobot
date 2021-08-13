const crypto = require('crypto');
const moment = require('moment');
const WebSocket = require('ws');

module.exports = class Ws {
    constructor(
        systemUtil,
        logger,
        tickers,
        projectDir
    ) {
        this.systemUtil = systemUtil;
        this.logger = logger;
        this.tickers = tickers;
        this.projectDir = projectDir;
    }

    start() {
        const host = this.systemUtil.getConfig('webserver.ip', '0.0.0.0');
        const port = this.systemUtil.getConfig('webserver.ws_port', 3001);

        const webSocketServer = new WebSocket.Server({ host, port });

        const me = this;

        webSocketServer.on('connection', ws => {
            ws.on('error', error => {
                me.logger.error(`WebSocket: Connection error: ${String(error)}`);
                
                setTimeout(() => {
                    me.logger.debug(`Websocket: Connection reconnect`);
                    me.start();
                }, 1000 * 30);
            });

            ws.on('close', (event) => {
                me.logger.error(
                    `WebSocket: Connection closed: ${JSON.stringify([
                        event.code,
                        event.message
                    ])}`
                );
            });

            ws.on('message', async event => {
                const body = JSON.parse(event);
                
                if (body.event === 'correlation') {
                    setInterval(async () => {
                        const data = this.tickers.all();
                        webSocketServer.clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify(data));
                            }
                        });
                    }, 1000 * 5);
                }
            });
        });

        me.logger.info(`WebSocket listening on: ${host}:${port}`);
        console.log(`WebSocket listening on: ${host}:${port}`);
    }
};
