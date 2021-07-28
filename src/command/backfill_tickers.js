const services = require('../modules/services');

module.exports = class BackfillTickersCommand {
    constructor() {}

    execute(time) {
        services.createBackfillTickersInstance().start(time);
    }
};
