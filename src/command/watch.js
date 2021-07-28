const services = require('../modules/services');

module.exports = class WatchCommand {
    constructor() {}

    execute(options) {
        services.createWatchInstance().start(options);
        services.createWebserverInstance().start();

        if (options.websocket === 'on') {
            services.createWebSocketInstance().start();
        }
    }
};
