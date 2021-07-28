const moment = require('moment');
const _ = require('lodash');
const querystring = require('querystring');
const f = require('node-fetch');

const Candlestick = require('./../dict/candlestick');

module.exports = class Ftx {
    constructor(eventEmitter, logger, queue, candleImport) {
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.queue = queue;
        this.candleImport = candleImport;

    }

    getName() {
        return 'ftx';
    }

    getBaseUrl() {
        // https://docs.ftx.com/#overview
        return 'https://ftx.com/api';
    }

    backfill(symbol, period, start, count) {
        return new Promise((resolve, reject) => {
            
            const formatedSymbol = Ftx.formatSymbol(symbol);
            const query = querystring.stringify({
                resolution: Ftx.formatPeriod(period), //period in seconds
                limit: count,
                start_time: moment(start).unix(),
                //end_time: 
            });

            f(`${this.getBaseUrl()}/markets/${formatedSymbol}/candles?${query}`)
                .then(res => {
                    if (res.ok) { // res.status >= 200 && res.status < 300
                        return res.json();
                    } else {
                        throw String(res.statusText);
                    }
                })
                .then(body => {
                    if (!Array.isArray(body.result)) {
                        throw `Ftx: Candle backfill error: ${JSON.stringify(body)}`;
                    }
                    
                    resolve(body.result.map(candle => {
                        return new Candlestick(
                            candle.time / 1000, //time incomin in milliseconds
                            candle.open,
                            candle.high,
                            candle.low,
                            candle.close,
                            Ftx.formatVolume(candle.volume)
                        );
                    }))
                })
                .catch(err => {throw new Error(`Ftx: Candle backfill error: ${String(err)}`)})
        })        
    }

    static formatPeriod(period) {
        const oneDayInSeconds = 86400;
        const oneMinuteInSecond = 60;

        if (period.match(/[m]/g)) {
            const val = period.replace(/[m]/g, '');
            return +val * oneMinuteInSecond;
        } else if (period.match(/[d]/g)) {
            const val = period.replace(/[d]/g, '');
            return +val * oneDayInSeconds;
        } else {
            return undefined;
        }
    }

    static formatSymbol(symbol) {
        //Нужно с BTCUSDT => BTC/USDT
        //BTCUSD => BTC/USD
        //USDTUSD => USDT/USD
        
        if (symbol.indexOf('BTC') === 0) {
            return symbol.replace('BTC', 'BTC/');
        } else if (symbol.indexOf('BTC') > 0) {
            return symbol.replace('BTC', '/BTC');
        } else if (symbol.indexOf('USDT') === 0) {
            return symbol.replace('USDT', 'USDT/');
        } else if (symbol.indexOf('USDT') > 0) {
            return symbol.replace('USDT', '/USDT');
        } else if (symbol.indexOf('ETH') === 0) {
            return symbol.replace('ETH', 'ETH/');
        } else if (symbol.indexOf('ETH') > 0) {
            return symbol.replace('ETH', '/ETH');
        } else if (symbol.indexOf('SPY') === 0) {
            return symbol.replace('SPY', 'SPY/');
        } else if (symbol.indexOf('GLD') === 0) {
            return symbol.replace('GLD', 'GLD/');
        } else {
            return symbol
        }
    }

    static formatVolume(volume) {
        return Math.trunc(volume);
    }
};
