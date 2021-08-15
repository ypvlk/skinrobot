const WebSocket = require('ws');
const ccxt = require('ccxt');

const moment = require('moment');
const _ = require('lodash');

const Candlestick = require('./../dict/candlestick');
const Ticker = require('../dict/ticker');
const ExchangeOrder = require('../dict/exchange_order');
const ExchangePosition = require('../dict/exchange_position');
const ExchnageBalance = require('../dict/exchange_balance');

const TickerEvent = require('../event/ticker_event');
const ExchangeOrderEvent = require('../event/exchange_order_event');
const ExchangePositionEvent = require('../event/exchange_position_event');


module.exports = class BinanceFutures {
    constructor(eventEmitter, logger, queue, candleImport, throttler, requestClient) {
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.queue = queue;
        this.candleImport = candleImport;
        this.throttler = throttler;
        this.requestClient = requestClient;
        
        
        this.tickers = {};
        this.balances = [];
        this.ccxtClient = undefined;
        this.binanceNodeApiClient = undefined;

        this.closes = {};
        this.closesWasUpdate = false;
    }

    getName() {
        return 'binance_futures';
    }

    getBaseUrl() {
        // https://binance-docs.github.io/apidocs/futures/en/#change-log
        return 'https://fapi.binance.com';
    }

    getLimit() {
        return 1000;
    }

    start(config, symbols) {

        this.ccxtClient = new ccxt.binance({
            apiKey: config.key,
            secret: config.secret,
            options: { defaultType: 'future', warnOnFetchOpenOrdersWithoutSymbol: false }
        });

        const me = this;
        
        if (config.key && config.secret && config.key.length > 0 && config.secret.length > 0) {
            setInterval(async () => { //update closes
                if (
                    (Object.keys(me.closes).length === 0 && !me.closesWasUpdate) 
                    || 
                    (new Date().getUTCHours() === 0 && new Date().getUTCMinutes() < 5 && !me.closesWasUpdate)
                ) { 

                    me.throttler.addTask('binance_futures_closes_update', async () => {
                        await me.saveCloses(symbols);
                    }, 1000);

                    me.closesWasUpdate = true;

                    
                    
                    me.throttler.addTask('binance_futures_closes_was_update', async () => {
                        me.closesWasUpdate = false;
                    }, 1000 * 60 * 6);
                }
            }, 1000 * 5);
            
            setInterval(async () => {
                me.throttler.addTask('binance_futures_sync_orders', async () => {
                    await me.syncOrdersViaRestApi();
                });
            }, 1000 * 30); //1000 * 30

            setInterval(async () => {
                me.throttler.addTask('binance_futures_sync_positions', async () => {
                    await me.syncPositionViaRestApi()
                });
            }, 1000 * 36); //1000 * 36

            setTimeout(async () => {
                me.throttler.addTask('binance_futures_sync_orders', async () => {
                    await me.syncOrdersViaRestApi();
                });
                me.throttler.addTask('binance_futures_sync_positions', async () => {
                    await me.syncPositionViaRestApi();
                });
            }, 1000);

            setTimeout(async () => {
                await me.initUserWebsocket();
            }, 3000);

            setTimeout(async () => {
                await me.initPublicWebsocket(symbols);
            }, 5000); //5000
        } else {
            me.logger.info('Binance Futures: Starting as anonymous; no trading possible');
        }
    }

    async backfillCandles(symbol, period, startTime) { //backfillCandles
        const options = {
            interval: period,
            symbol: symbol.toUpperCase(),
            limit: this.getLimit(),
            startTime: moment(startTime * 1000).unix()
        };

        const uri = `${this.getBaseUrl()}/fapi/v1/klines`;

        let result = [];

        try {
            result = await this.requestClient.executeGETRequest(uri, options);
        } catch (err) {
            this.logger.error(`Binance Futures: Candle backfill request error: ${String(err)}`);
        }
        
        if (!Array.isArray(result)) {
            this.logger.error(`Binance Futures: result must be an array: ${JSON.stringify(result)}`);
            return [];
        }

        return result.map(candle => {
            return new Candlestick(
                moment(candle[0]).format('X'),
                candle[1],
                candle[2],
                candle[3],
                candle[4],
                BinanceFutures.formatVolume(candle[5]),
                candle[6]
            );
        })  
    }

    async getCloses(symbol, period, time) {
        const options = {
            interval: period,
            symbol: symbol,
            limit: 1,
            // startTime: new Date() / 1 - 86400000
            endTime: time//new Date() / 1 - 86400000
        };

        const uri = `${this.getBaseUrl()}/fapi/v1/klines`;

        let result = [];

        try {
            result = await this.requestClient.executeGETRequest(uri, options);
        } catch (err) {
            this.logger.error(`Binance Futures:  Get closes request error: ${String(err)}`);
        }
        
        if (!Array.isArray(result)) {
            this.logger.error(`Binance Futures: Result must be an array: ${JSON.stringify(result)}`);
            return [];
        }

        if (result.length === 0) {
            this.logger.error(`Binance Futures: Get closes empty response: ${JSON.stringify(body)}`);
            return [];
        }

        return (Number(result[0][4]));
    }

    async saveCloses(symbols) {
        const period = '1d';
        const time = new Date() / 1 - 86400000; //close yesterday

        for (const symbol of symbols) {
            this.closes[`${symbol.symbol}`] = await this.getCloses(symbol.symbol, period, time);
        }

        this.logger.debug(`Closes have updated for ${symbols.length} pairs`);
        console.log(`Closes have updated for ${symbols.length} pairs`);
    }

    async order(order) {
        return this.ccxtClient.createOrder(
            order.symbol.replace('USDT', '/USDT'), 
            order.type, 
            order.side === 'long' ? 'buy' : 'sell', 
            order.amount
        );
    }

    async cancelOrderByID(orderID, symbol) {
        return this.ccxtClient.cancelOrder(orderID, symbol); //orderID: string
    }

    async closeOnePosition(position) {
        return this.ccxtClient.createOrder(
            position.symbol.replace('USDT', '/USDT'),
            'market',
            position.side === 'long' ? 'sell' : 'buy',
            position.amount < 0 ? (-1) * position.amount : position.amount
        ); //position: object
    }

    async initPublicWebsocket(symbols) {
        const me = this;
    
        const allSubscriptions = [];

        symbols.forEach(symbol => {
            allSubscriptions.push(`${symbol.symbol.toLowerCase()}@bookTicker`);
            // allSubscriptions.push(...symbol.periods.map(p => `${symbol.symbol.toLowerCase()}@kline_${p}`));
        });
    
        me.logger.info(`Binance Futures: Public stream subscriptions: ${allSubscriptions.length}`);
    
        // "A single connection can listen to a maximum of 200 streams."; let us have some window frames
        _.chunk(allSubscriptions, 180).forEach((allSubscriptionsChunk, indexConnection) => {
            me.initPublicWebsocketChunk(allSubscriptionsChunk, indexConnection);
        });
    }

    initPublicWebsocketChunk(subscriptions, indexConnection) {
        const me = this;
        const ws = new WebSocket('wss://fstream.binance.com/stream');

        ws.onerror = function(event) {
            me.logger.error(
                `Binance Futures: Public stream (${indexConnection}) error: ${JSON.stringify([event.code, event.message])}`
            );
            console.log(`Binance Futures: Public stream (${indexConnection}) error: ${JSON.stringify([event.code, event.message])}`);
        };

        let subscriptionTimeouts = {};

        ws.onopen = function() {
            me.logger.info(`Binance Futures: Public stream (${indexConnection}) opened.`);
            console.log(`Binance Futures: Public stream (${indexConnection}) opened.`);

            me.logger.info(
                `Binance Futures: Needed Websocket (${indexConnection}) subscriptions: ${JSON.stringify(subscriptions.length)}`
            );

            // "we are only allowed to send 5 requests per second"; but limit it also for the "SUBSCRIBE" itself who knows upcoming changes on this
            _.chunk(subscriptions, 15).forEach((subscriptionChunk, index) => {
                subscriptionTimeouts[index] = setTimeout(() => {
                    me.logger.debug(
                        `Binance Futures: Public stream (${indexConnection}) subscribing: ${JSON.stringify(subscriptionChunk)}`
                    );

                    ws.send(
                        JSON.stringify({
                            method: 'SUBSCRIBE',
                            params: subscriptionChunk,
                            id: Math.floor(Math.random() * Math.floor(100))
                        })
                    );

                    delete subscriptionTimeouts[index];
                }, (index + 1) * 1500);
            });
        };

        ws.onmessage = async function(event) {
            if (event.type && event.type === 'message') {
                const body = JSON.parse(event.data);

                if (body.stream && body.stream.toLowerCase().includes('@bookticker')) {
                        me.eventEmitter.emit('ticker',
                            new TickerEvent(
                                me.getName(),
                                body.data.s,
                                (me.tickers[body.data.s] = new Ticker(
                                    me.getName(),
                                    body.data.s,
                                    moment().format('X'),
                                    parseFloat(body.data.b),
                                    parseFloat(body.data.B),
                                    parseFloat(body.data.a),
                                    parseFloat(body.data.A),
                                    me.closes && me.closes[body.data.s] || 0
                                ))
                            )
                        );
                }
            }
        };

        ws.onclose = function(event) {
            me.logger.error(
                `Binance Futures: Public Stream (${indexConnection}) connection closed: ${JSON.stringify([
                    event.code,
                    event.message
                ])}`
            );

            Object.values(subscriptionTimeouts).forEach(timeout => {
                clearTimeout(timeout);
            });

            subscriptionTimeouts = {};

            setTimeout(() => {
                me.logger.info(`Binance Futures: Public stream (${indexConnection}) connection reconnect`);
                me.initPublicWebsocketChunk(subscriptions, indexConnection);
            }, 1000 * 30);
        };
    }

    async initUserWebsocket() {
        let response;

        try {
            response = await this.ccxtClient.fapiPrivatePostListenKey();
        } catch (e) {
            this.logger.error(`Binance Futures: listenKey error: ${String(e)}`);
            return undefined;
        }

        if (!response || !response.listenKey) {
            this.logger.error(`Binance Futures: invalid listenKey response: ${JSON.stringify(response)}`);
            return undefined;
        }

        const me = this;
        const ws = new WebSocket(`wss://fstream.binance.com/ws/${response.listenKey}`);
        ws.onerror = function(e) {
            me.logger.info(`Binance Futures: Connection error: ${String(e)}`);
        };

        ws.onopen = function() {
            console.log(`Binance Futures: Opened user stream`);
            me.logger.info(`Binance Futures: Opened user stream`);
        };

        ws.onmessage = async function(event) {
            if (event && event.type === 'message') {
                const message = JSON.parse(event.data);
                if (message.e && message.e.toUpperCase() === 'ORDER_TRADE_UPDATE') {
                    const order = me.createOrderFromWebsocket(message.o);

                    me.logger.info(`Binance Futures: ORDER_TRADE_UPDATE event: ${JSON.stringify([message.e, message.o, order])}`);
                }

                if (message.e && message.e.toUpperCase() === 'ACCOUNT_UPDATE') {
                    me.accountUpdate(message);
                }
            }
        };

        const heartbeat = setInterval(async () => {
            try {
                await this.ccxtClient.fapiPrivatePutListenKey();
                // this.logger.debug('Binance Futures: user stream ping successfully done');
            } catch (e) {
                this.logger.error(`Binance Futures: user stream ping error: ${String(e)}`);
            }
        }, 1000 * 60 * 10);

        ws.onclose = function(event) {
            me.logger.error(`Binance futures: User stream connection closed: ${JSON.stringify([event.code, event.message])}`);
            clearInterval(heartbeat);

            setTimeout(async () => {
                me.logger.info('Binance futures: User stream connection reconnect');

                await me.initUserWebsocket();
            }, 1000 * 30);
        };

        return true;
    }

    accountUpdate(message) {
        const me = this;
        if (message.a && message.a.B) {
            message.a.B.forEach(balance => {
                if (balance.a && balance.wb) {
                    me.createBalanceFromWebsocket(balance);
                }
            });
        }

        if (message.a && message.a.P) {
            message.a.P.forEach(position => {
                if (position.s && position.ps && position.ps.toLowerCase() === 'both') {
                    me.createPositionFromWebsocket(position);
                }
            });
        }

    }

    createOrderFromWebsocket(websocketOrder) {
        const me = this;
        const order = websocketOrder;

        //     {
        //         "symbol": "BTCUSDT",
        //         "orderId": 1,
        //         "clientOrderId": "myOrder1",
        //         "price": "0.1",
        //         "origQty": "1.0",
        //         "executedQty": "1.0",
        //         "cumQuote": "10.0",
        //         "status": "NEW",
        //         "timeInForce": "GTC",
        //         "type": "LIMIT",
        //         "side": "BUY",
        //         "stopPrice": "0.0",
        //         "updateTime": 1499827319559
        //     }

        const map = {
            s: 'symbol',
            // c: 'clientOrderId',
            S: 'side',
            o: 'type',
            q: 'amount',
            p: 'price',
            X: 'status',
            i: 'orderId',
            T: 'updateTime'
            // n: 'cumQuote' // not fully sure about commision
        };

        const newOrder = {};
        Object.keys(order).forEach(k => {
            if (map[k]) {
                newOrder[map[k]] = order[k];
            }
        });

        if (newOrder.status !== 'NEW' && newOrder.status !== 'CANCELED' && newOrder.status !== 'FILLED') {
            return undefined;
        }

        me.eventEmitter.emit('exchange_order',
            new ExchangeOrderEvent(
                me.getName(),
                newOrder.symbol,
                newOrder.status === 'NEW' ? ExchangeOrderEvent.ACTION_SAVE : ExchangeOrderEvent.ACTION_DELETE,
                new ExchangeOrder(
                    newOrder.orderId,
                    me.getName(),
                    newOrder.symbol,
                    newOrder.status,
                    newOrder.price,
                    newOrder.amount,
                    newOrder.side.toLowerCase(),//BinanceFutures.formatOrderSide(newOrder.side),
                    newOrder.type.toLowerCase(),
                    newOrder.updateTime
                )
            )
        )
    }

    createPositionFromWebsocket(position) {
        const me = this;

        //position closed
        if (position.pa && position.pa === '0') {
            this.logger.info(
                `Binance Futures: Websocket position closed/removed: ${JSON.stringify([position.s, position])}`
            );

            me.eventEmitter.emit('exchange_position',
                new ExchangePositionEvent(
                    me.getName(),
                    position.s,
                    ExchangePositionEvent.ACTION_DELETE,
                    undefined
                )
            )
        }

        const positionAmt = parseFloat(position.pa);
        const entryPrice = parseFloat(position.ep);

        // position open
        if (position.pa !== '0' && (parseFloat(position.ep) > 0.00001 || parseFloat(position.ep) < -0.00001)) { // prevent float point issues {
            this.logger.info(`Binance Futures: Websocket position new found: ${JSON.stringify([position.s, position])}`);
            
            me.eventEmitter.emit('exchange_position', 
                new ExchangePositionEvent(
                    me.getName(),
                    position.s,
                    ExchangePositionEvent.ACTION_SAVE,
                    new ExchangePosition(
                        me.getName(),
                        position.s,
                        Number(positionAmt) < 0 ? 'short' : 'long',
                        positionAmt,
                        position.up,
                        BinanceFutures.calcPnLPercent(position.up, entryPrice),
                        new Date(), //Math.floor(new Date() / 1000),
                        entryPrice
                    ) 
                )
            )
        }

        // // position update
        // if (position.s in this.positions) {
        //     this.logger.info(
        //     `Binance Futures: Websocket position update: ${JSON.stringify([
        //         position.s,
        //         position.pa,
        //         this.positions[position.s].getAmount()
        //     ])}`
        //     );
        // }
    }

    createBalanceFromWebsocket(balance) {
        const me = this;

        me.eventEmitter.emit('exchange_balance', 
            new ExchnageBalance(
                me.getName(),
                balance.a,
                balance.wb
            )
        );
    }

    async syncOrdersViaRestApi() {
        const me = this;
        let orders;

        try {
            orders = await me.ccxtClient.fetchOpenOrders();
        } catch (e) {
            me.logger.error(`Binance Futures SyncOrder timeout: ${String(e)}`);
            return undefined;
        }

        if (!Array.isArray(orders) || orders.length === 0) return undefined;
        
        orders.forEach(order => {
            if (order.info.status !== 'NEW' && order.info.status !== 'CANCELED' && order.info.status !== 'FILLED') return undefined;

            me.eventEmitter.emit('exchange_order',
                new ExchangeOrderEvent(
                    me.getName(),
                    order.info.symbol,
                    order.info.status === 'NEW' ? ExchangeOrderEvent.ACTION_SAVE : ExchangeOrderEvent.ACTION_DELETE,
                    new ExchangeOrder(
                        order.info.orderId,
                        me.getName(),
                        order.info.symbol,
                        order.info.status,
                        order.info.price,
                        order.amount,
                        order.info.side.toLowerCase(),//BinanceFutures.formatOrderSide(order.info.side),
                        order.info.type,
                        order.info.updateTime
                    )
                )
            )
        });

        me.logger.debug(`Binance Futures: orders updates: ${orders.length}`);
    }

    async syncPositionViaRestApi() {
        const me = this;
        let response;

        try {
            response = await me.ccxtClient.fapiPrivateGetPositionRisk();
        } catch (e) {
            me.logger.error(`Binance Futures: error getting positions:${e}`);
            return undefined;
        }
        
        const positions = response.filter(position => position.entryPrice && parseFloat(position.entryPrice) > 0);
        if (!Array.isArray(positions) || positions.length === 0) return undefined;
        
        positions.forEach(position => {
            me.eventEmitter.emit('exchange_position',
                new ExchangePositionEvent(
                    me.getName(),
                    position.symbol,
                    ExchangePositionEvent.ACTION_SAVE,
                    new ExchangePosition(
                        me.getName(),
                        position.symbol,
                        position.positionAmt < 0 ? 'short' : 'long',
                        position.positionAmt,
                        position.unRealizedProfit,
                        BinanceFutures.calcPnLPercent(position.unRealizedProfit, position.entryPrice),
                        position.updateTime, //Math.floor(new Date() / 1000),
                        position.entryPrice
                    ) 
                )
            )
        });

        me.logger.debug(`Binance Futures: positions updates: ${positions.length}`);
    }

    static formatVolume(volume) {
        return Math.trunc(volume);
    }

    static calcPnLPercent(pnl, entryPrice) {
        if (pnl && entryPrice) {
            return (
                (pnl / entryPrice) * 100
            );
        }
    }

    // static formatOrderAction(status) {
    //     if (typeof status !== 'string') return undefined;
        
    //     if (status === 'NEW') {
    //         return 'SAVE';
    //     } else if (status === 'CANCELED') {
    //         return 'DELETE';
    //     } else {
    //         return undefined;
    //     }
    // }

    // static formatTo(side) {
    //     return (side.toLowerCase() || undefined)
    // }
};
