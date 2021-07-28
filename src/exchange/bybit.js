const moment = require('moment');
const _ = require('lodash');
const querystring = require('querystring');
const f = require('node-fetch');

const Candlestick = require('./../dict/candlestick');

module.exports = class Bybit {
    constructor(eventEmitter, logger, queue, candleImport) {
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.queue = queue;
        this.candleImport = candleImport;

    }

    getName() {
        return 'bybit';
    }

    getBaseUrl() {
        // https://bybit-exchange.github.io/docs/inverse/#t-orderbook
        return 'https://api.bybit.com/v2';
    }

    backfill(symbol, period, start, count) {
        return new Promise((resolve, reject) => {
            const query = querystring.stringify({
                interval: Bybit.formatPeriod(period),
                symbol: symbol,
                limit: count,
                from: moment(start).unix()
            });
            
            f(`${this.getBaseUrl()}/public/kline/list?${query}`)
                .then(res => {
                    if (res.ok) { // res.status >= 200 && res.status < 300
                        return res.json();
                    } else {
                        throw String(res.statusText);
                    }
                })
                .then(body => {
                    if (!Array.isArray(body.result)) {
                        throw `Bybit: Candle backfill error: ${JSON.stringify(body)}`;
                    }
                    
                    resolve(body.result.map(candle => {
                        return new Candlestick(
                            candle.open_time,
                            candle.open,
                            candle.high,
                            candle.low,
                            candle.close,
                            Bybit.formatVolume(candle.volume)
                        );
                    }))
                })
                .catch(err => {throw new Error(`Bybit: Candle backfill error: ${String(err)}`)})
        })        
    }

    static formatPeriod(period) {
        if (period.match(/[d]/g)) return 'D';
        if (period.match(/[m]/g)) return period.replace(/[m]/g, '');
        return period;
    }

    static formatVolume(volume) {
        return Math.trunc(volume);
    }
};
