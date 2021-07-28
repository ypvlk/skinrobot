const BFX = require('bitfinex-api-node');

const { Order } = require('bfx-api-node-models');
const moment = require('moment');
const _ = require('lodash');
const querystring = require('querystring');
const f = require('node-fetch');

const ExchangeCandlestick = require('../dict/exchange_candlestick');
const Candlestick = require('./../dict/candlestick');


const TickerEvent = require('../event/ticker_event.js');
const Ticker = require('../dict/ticker');


// const ExchangeOrder = require('../dict/exchange_order');
// const OrderUtil = require('../utils/order_util');

module.exports = class Bitfinex {
    constructor(eventEmitter, logger, candleImport) {
        this.eventEmitter = eventEmitter;
        this.candleImport = candleImport;
        this.logger = logger;
        // this.requestClient = requestClient;

        this.positions = {};
        this.orders = [];
        this.exchangePairs = {};
        this.tickers = {};
    }

    getName() {
        return 'bitfinex';
    }

    getBaseUrl() {
        // https://docs.bitfinex.com/docs/introduction
        return 'https://api-pub.bitfinex.com/v2';
    }

    backfill(symbol, period, start, count) {

        return new Promise((resolve, reject) => {
            const path = `/candles/trade:${Bitfinex.formatPeriod(period)}:t${symbol}/hist`;
            const query = querystring.stringify({
                interval: period,
                // sort: 1,
                limit: count,
                start: moment(start * 1000).unix()
                // end:
            });
            
            f(`${this.getBaseUrl()}${path}?${query}`)
                .then(res => {
                    if (res.ok) { // res.status >= 200 && res.status < 300
                        return res.json();
                    } else {
                        throw String(res.statusText);
                    }
                })
                .then(body => {
                    // console.log('body', body);
                    // return
                    if (!Array.isArray(body)) {
                        throw `Bitfinex: Candle backfill error: ${JSON.stringify(body)}`;
                    }
                    
                    resolve(body.map(candle => {
                        return new Candlestick(
                            moment(candle[0]).format('X'),
                            candle[1],
                            candle[3],
                            candle[4],
                            candle[2],
                            Bitfinex.formatVolume(candle[5])
                        );
                    }))
                })
                .catch(err => {throw new Error(`Bitfinex: Candle backfill error: ${String(err)}`)})
        })        
    }

    start(config, symbols) {
        const subscriptions = [];

        symbols.forEach(instance => {
            // // candles
            // instance.periods.forEach(period => {
            //     let myPeriod = period;
            //     if (period === '1d') {
            //         myPeriod = period.toUpperCase();
            //     }

            //     subscriptions.push({    
            //         type: 'subscribeCandles',
            //         parameter: `trade:${myPeriod}:t${instance.symbol}`
            //     });
            // });

            // ticker
            subscriptions.push({
                type: 'subscribeTicker',
                parameter: `t${instance.symbol}`
            });
        });

        // split subscriptions into chunks; currently limit is 30 (reduce it on our side, also) based on Bitfinex api
        _.chunk(subscriptions, 25).forEach((chunk, index) => {
            // chunk connect, but wait for each chunk for possible connection limit
            setTimeout(async () => {
                this.openPublicWebsocketChunk(chunk, index + 1);
            }, 2250 * (index + 1));
        });

        const isAuthed = config.key && config.secret && config.key.length > 0 && config.secret.length > 0;

        if (!isAuthed) {
            this.logger.info('Bitfinex: Starting as anonymous; no trading possible');
        } else {
            const me = this;
            this.client = this.openAuthenticatedPublicWebsocket(config.key, config.secret);

            // setInterval(
            //     (function f() {
            //         me.syncSymbolDetails();
            //         return f;
            //     })(),
            //     60 * 60 * 30 * 1000
            // );
        }
    }

    async order(order) {
        const result = await new Order(Bitfinex.createOrder(order)).submit(this.client);

        const executedOrder = Bitfinex.createExchangeOrder(result);
        this.triggerOrder(executedOrder);

        return executedOrder;
    }

    /**
     * Connect to websocket on chunks because Bitfinex limits per connection subscriptions eg to 30
     *
     * @param subscriptions
     * @param index current chunk
     */
    openPublicWebsocketChunk(subscriptions, index) {
        const me = this;

        me.logger.debug(`Bitfinex: public websocket ${index} chunks connecting: ${JSON.stringify(subscriptions)}`);
        console.log(`Bitfinex: public websocket ${index} chunks connecting: ${JSON.stringify(subscriptions)}`);

        const ws = new BFX({
            version: 2,
            transform: true,
            autoOpen: true
        }).ws();

        ws.on('error', err => {
            me.logger.error(`Bitfinex: public websocket ${index} error: ${JSON.stringify(err)}`);
            console.log(`Bitfinex: public websocket ${index} error: ${JSON.stringify(err)}`);
        });

        ws.on('close', () => {
            me.logger.error(`Bitfinex: public websocket ${index} Connection closed; reconnecting soon`);

            // retry connecting after some second to not bothering on high load
            setTimeout(() => {
                me.logger.info(`Bitfinex: public websocket ${index} Connection reconnect`);
                ws.open();
            }, 10000);
        });

        ws.on('open', () => {
            me.logger.info(`Bitfinex: public websocket ${index} connection open. Subscription to ${subscriptions.length} channels`);
            console.log(`Bitfinex: public websocket ${index} connection open. Subscription to ${subscriptions.length} channels`);

            subscriptions.forEach(subscription => {
                ws[subscription.type](subscription.parameter);
            });
        });

        ws.on('ticker', (pair, ticker) => {
            const symbol = Bitfinex.formatSymbol(pair);
            
            me.eventEmitter.emit('ticker',
                new TickerEvent(
                    this.getName(),
                    symbol,
                    (me.tickers[symbol] = new Ticker(
                        this.getName(), 
                        symbol, 
                        moment().format('X'), 
                        ticker.bid, 
                        ticker.bidSize,
                        ticker.ask,
                        ticker.askSize
                    ))
                )
            );
        });

        // ws.on('candle', async (candles, pair) => {
        //     const options = pair.split(':');

        //     if (options.length < 3) {
        //         return;
        //     }

        //     const period = options[1].toLowerCase();
        //     let mySymbol = options[2];

        //     if (mySymbol.substring(0, 1) === 't') {
        //         mySymbol = mySymbol.substring(1);
        //     }

        //     const myCandles = [];

        //     if (Array.isArray(candles)) {
        //         candles.forEach(function(candle) {
        //         myCandles.push(candle);
        //         });
        //     } else {
        //         myCandles.push(candles);
        //     }

        //     const sticks = myCandles
        //         .filter(function(candle) {
        //         return typeof candle.mts !== 'undefined';
        //         })
        //         .map(function(candle) {
        //         return new ExchangeCandlestick(
        //             'bitfinex',
        //             mySymbol,
        //             period.toLowerCase(),
        //             Math.round(candle.mts / 1000),
        //             candle.open,
        //             candle.high,
        //             candle.low,
        //             candle.close,
        //             candle.volume
        //         );
        //         });

        //     if (sticks.length === 0) {
        //         return;
        //     }

        //     await this.candleImport.insertThrottledCandles(sticks);
        // });

        ws.open();
    }

    /**
   * Create a websocket just for authenticated requests a written is official Bitfinex documentation
   *
   * @param apiKey
   * @param apiSecret
   * @returns {WSv1|WSv2}
   */
    openAuthenticatedPublicWebsocket(apiKey, apiSecret) {
        const ws = new BFX({
            version: 2,
            transform: true,
            autoOpen: true,
            apiKey: apiKey,
            apiSecret: apiSecret
        }).ws();

        const me = this;

        this.logger.info('Bitfinex: Authenticated Websocket connecting');

        ws.on('error', err => {
            me.logger.error(`Bitfinex: Authenticated Websocket error: ${JSON.stringify(err)}`);
        });

        ws.on('close', () => {
            me.logger.error('Bitfinex: Authenticated Websocket Connection closed; reconnecting soon');

            // retry connecting after some second to not bothering on high load
            setTimeout(() => {
                me.logger.info('Bitfinex: Authenticated Websocket Connection reconnect');
                ws.open();
            }, 10000);
        });

        ws.on('open', () => {
            me.logger.debug('Bitfinex: Authenticated Websocket Connection open');

            // authenticate
            ws.auth();
        });

        ws.onOrderUpdate({}, order => {
            console.log(`BitFinex onOrderUpdate: ${order}`);
            // me.onOrderUpdate(order);
        });

        ws.onOrderNew({}, order => {
            console.log(`BitFinex onOrderNew: ${order}`);
            // me.onOrderUpdate(order);
        });

        ws.onOrderClose({}, order => {
            console.log(`BitFinex onOrderClose: ${order}`);
            // me.onOrderUpdate(order);
        });

        ws.onOrderSnapshot({}, orders => {
            console.log(`BitFinex onOrderSnapshot: ${orders}`);
            // const marginOrder = orders.filter(order => !order.type.toLowerCase().includes('exchange'));

            // Bitfinex.createExchangeOrders(marginOrder).forEach(order => {
            //     me.orders[order.id] = order;
            // });
        });

        ws.onPositionSnapshot({}, positions => {
            console.log(`BitFinex onPositionSnapshot: ${positions}`);
            // me.onPositions(positions);
        });

        ws.onPositionUpdate({}, position => {
            console.log(`BitFinex onPositionUpdate: ${position}`);
            // me.onPositionUpdate(position);
        });

        ws.onPositionNew({}, position => {
            console.log(`BitFinex onPositionNew: ${position}`);
            // me.onPositionUpdate(position);
        });

        ws.onPositionClose({}, position => {
            console.log(`BitFinex onPositionClose: ${position}`);
            // me.onPositionUpdate(position);
        });

        ws.onBalanceInfoUpdate({}, balanceInfo => {
            console.log(`BitFinex onBalanceInfoUpdate: ${balanceInfo}`);
            // this.balanceInfo = balanceInfo;
        });

        ws.open();

        return ws;
    }

    static formatPeriod(period) {
        return period.replace(/[d]/g, 'D');
    }

    static formatVolume(volume) {
        return Math.trunc(volume);
    }
};
