const services = require('../modules/services');

module.exports = class BackfillCandlesCommand {
    constructor() {}

    async execute(exchangeName, symbol, period, days) {
        await services.getBackfillCandles().backfill(exchangeName, symbol, period, days);
    }
};
