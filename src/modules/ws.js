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

        webSocketServer.on('connection', ws => {
            ws.on('error', error => {
                this.logger.error(`WebSocket: Connection error: ${String(error)}`);
                
                setTimeout(() => {
                    this.logger.info(`Websocket: Connection reconnect`);
                    this.start();
                }, 1000 * 30);
            });

            ws.on('close', (event) => {
                this.logger.error(
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

        console.log(`WebSocket listening on: ${host}:${port}`);
    }
};
