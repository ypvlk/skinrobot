const services = require('../modules/services');

module.exports = class TradeCommand {
    constructor() {}

    execute(options) {
        services.createTradeInstance().start(options);
        services.createWebserverInstance().start();

        if (options.websocket === 'on') {
            services.createWebSocketInstance().start();
            services.createMonitoringInstance().start();
        }
    }
};
