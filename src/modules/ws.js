const crypto = require('crypto');
const moment = require('moment');
const WebSocket = require('ws');

module.exports = class Ws {
    constructor(
        systemUtil,
        logger,
        tickers, //TODO delte tickers
        monitoringService,
        projectDir
    ) {
        this.systemUtil = systemUtil;
        this.logger = logger;
        this.tickers = tickers;
        this.monitoringService = monitoringService;
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
                if (event && event.code && event.message) {
                    me.logger.error(`WebSocket: Connection closed: ${JSON.stringify([
                            event.code,
                            event.message
                        ])}`
                    );
                }

                console.log(`WebSocket: Connection closed: ${JSON.stringify(event)}`);
            });

            ws.on('message', async event => {
                const body = JSON.parse(event);

                if (body.event === 'monitoring') {
                    setInterval(async () => {
                        const data = me.monitoringService.all();
                        webSocketServer.clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify(data));
                            }
                        });
                    }, 1000 * 10);
                }
                
                if (body.event === 'correlation') {
                    setInterval(async () => {
                        const data = this.tickers.all(); //TODO delete tickers
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
