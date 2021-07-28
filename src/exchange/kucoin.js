const moment = require('moment');
const _ = require('lodash');
const querystring = require('querystring');
const f = require('node-fetch');

const Candlestick = require('./../dict/candlestick');

module.exports = class Kucoin {
    constructor(eventEmitter, logger, queue, candleImport) {
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.queue = queue;
        this.candleImport = candleImport;

    }

    getName() {
        return 'kucoin';
    }

    getBaseUrl() {
        // https://docs.kucoin.com/#general
        return 'https://api.kucoin.com/api/v1';
    }

    backfill(symbol, period, start, count) {
        return new Promise((resolve, reject) => {
            const query = querystring.stringify({
                type: Kucoin.formatPeriod(period),
                symbol: Kucoin.formatSymbol(symbol),
                startAt: moment(start).unix(),
                // endAt: moment(start).unix()
            });

            f(`${this.getBaseUrl()}/market/candles?${query}`)
                .then(res => {
                    if (res.ok) { // res.status >= 200 && res.status < 300
                        return res.json();
                    } else {
                        throw String(res.statusText);
                    }
                })
                .then(body => {
                    if (!Array.isArray(body.data)) {
                        throw `Kucoin: Candle backfill error: ${JSON.stringify(body)}`;
                    }
                    
                    resolve(body.data.map(candle => {
                        return new Candlestick(
                            candle[0],
                            candle[1],
                            candle[3],
                            candle[4],
                            candle[2],
                            formatVolume(candle[6])
                        );
                    }))
                })
                .catch(err => {throw new Error(`Kucoin: Candle backfill error: ${String(err)}`)})
        })        
    }

    static formatPeriod(period) {
        if (period.match(/[m]/g)) return period.replace(/[m]/g, 'min');
        if (period.match(/[d]/g)) return period.replace(/[d]/g, 'day');
        return undefined;
    }

    static formatSymbol(symbol) {
        //Нужно с BTCUSDT => BTC-USDT
        //BTCUSD => BTC-USD
        //USDTUSD => USDT-USD
        
        if (symbol.indexOf('BTC') === 0) {
            return symbol.replace('BTC', 'BTC-');
        } else if (symbol.indexOf('BTC') > 0) {
            return symbol.replace('BTC', '-BTC');
        } else if (symbol.indexOf('USDT') === 0) {
            return symbol.replace('USDT', 'USDT-');
        } else if (symbol.indexOf('USDT') > 0) {
            return symbol.replace('USDT', '-USDT');
        } else if (symbol.indexOf('ETH') === 0) {
            return symbol.replace('ETH', 'ETH-');
        } else if (symbol.indexOf('ETH') > 0) {
            return symbol.replace('ETH', '-ETH');
        } else {
            return symbol
        }
    }

    static formatVolume(volume) {
        return Math.trunc(volume);
    }
};
