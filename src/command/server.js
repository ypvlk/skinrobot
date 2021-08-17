const services = require('../modules/services');

module.exports = class ServerCommand {
    constructor() {}

    execute(options) {
        services.createWebserverInstance().start();

        if (options.websocket === 'on') {
            services.createWebSocketInstance().start();
            services.createMonitoringInstance().start();
        }
    }
};
