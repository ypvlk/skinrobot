const moment = require('moment');
const _ = require('lodash');
const ExchangeCandlestick = require('../dict/exchange_candlestick');

module.exports = class BackfillCandles {
    constructor(exchangesIterator, candleImporter) {
        this.exchangesIterator = exchangesIterator;
        this.candleImporter = candleImporter;
    }
    
    async backfill(exchangeName, symbol, period, days) {
        const exchange = this.exchangesIterator.find(e => e.getName() === exchangeName);
        
        if (!exchange) throw `Exchange not found: ${exchangeName}`;

        let startTime = moment().subtract(days, 'days');
        let candles;

        do {
            console.log(`Since: ${new Date(startTime).toISOString()}`);

            candles = await exchange.backfillCandles(symbol, period, startTime);

            const exchangeCandlesticks = candles.map(candle => {
                return ExchangeCandlestick.createFromCandle(exchangeName, symbol, period, candle);
            });

            await this.candleImporter.insertCandles(exchangeCandlesticks);

            console.log(`Got: ${candles.length} candles`);

            startTime = _.max(candles.map(r => new Date(r.close_time)));
        } while (candles.length > 0);

        console.log('finish');
    }
};
