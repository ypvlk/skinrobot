const moment = require('moment');
const f = require('node-fetch');
const crypto = require('crypto');
const BitMEXClient = require('bitmex-realtime-api');
const _ = require('lodash');
const querystring = require('querystring');

const TickerEvent = require('./../event/ticker_event');
const Ticker = require('./../dict/ticker');

const Candlestick = require('./../dict/candlestick');
const ExchangeCandlestick = require('../dict/exchange_candlestick');

// const resample = require('./../utils/resample');

// const Position = require('../dict/position');
// const Order = require('../dict/order');
// const ExchangeOrder = require('../dict/exchange_order');

// const orderUtil = require('../utils/order_util');

module.exports = class Bitmex {
    constructor(eventEmitter, requestClient, logger, queue, candleImporter) {
    // constructor(eventEmitter, requestClient, candlestickResample, logger, queue, candleImporter) {
        this.eventEmitter = eventEmitter;
        this.requestClient = requestClient;
        // this.candlestickResample = candlestickResample;
        this.logger = logger;
        this.queue = queue;
        this.candleImporter = candleImporter;

        this.apiKey = undefined;
        this.apiSecret = undefined;
        this.tickSizes = {};
        this.lotSizes = {};
        this.leverageUpdated = {};
        this.retryOverloadMs = 944; // Overload: API docs says use 500ms we give us more space
        this.retryOverloadLimit = 5; // Overload: Retry until fail finally

        this.positions = {};
        this.orders = {};
        this.tickers = {};
        this.symbols = [];

        this.inversedSymboles = [];
    }

    getName() {
        return 'bitmex';
    }

    getBaseUrl() {
        // https://www.bitmex.com/api/explorer/
        return 'https://www.bitmex.com';
    }

    backfill(symbol, period, start, count) {
        return new Promise((resolve, reject) => {
            const query = querystring.stringify({
                binSize: period,
                partial: true,//false,
                symbol: symbol,
                count: count,
                reverse: false,
                startTime: moment(start).format()
            });
            
            f(`${this.getBaseUrl()}/api/v1/trade/bucketed?${query}`)
                .then(res => {
                    if (res.ok) { // res.status >= 200 && res.status < 300
                        return res.json();
                    } else {
                        throw String(res.statusText);
                    }
                })
                .then(body => {
                    // console.log('body: ', body);
                    if (!Array.isArray(body)) {
                        throw `Bitmex: Candle backfill error: ${JSON.stringify(body)}`;
                    }
                    
                    let measurement = 0; //Погрешность для коректировки даты
                    if (period === '1d') {
                        measurement = 86400;
                    }
                    
                    resolve(body.map(candle => {
                        return new Candlestick(
                            moment(candle.timestamp).format('X') - measurement,
                            candle.open,
                            candle.high,
                            candle.low,
                            candle.close,
                            Bitmex.formatVolume(candle.volume)
                        );
                    }))
                })
                .catch(err => {throw new Error(`Bitmex: Candle backfill error: ${String(err)}`)})
        })        
    }

    start(config, symbols) {
        // https://www.bitmex.com/app/wsAPI#Subscriptions
        const { eventEmitter } = this;
        const { logger } = this;
        const { tickSizes } = this;
        const { lotSizes } = this;

        this.symbols = symbols;
        this.positions = {};
        this.orders = {};
        this.leverageUpdated = {};

        const opts = {
            testnet: this.getBaseUrl().includes('testnet')
        };

        if (config.key && config.secret && config.key.length > 0 && config.secret.length > 0) {
            opts.apiKeyID = this.apiKey = config.key;
            opts.apiKeySecret = this.apiSecret = config.secret;
        }

        const client = new BitMEXClient(opts);

        client.on('initialize', () => {
            logger.info('Bitmex: Connection initialized.');
            console.log('Bitmex: Connection initialized.');
        });

        client.on('error', error => {
            console.error(error);
            logger.error(`Bitmex: error ${String(error)}`);
        });

        client.on('open', () => {
            logger.info('Bitmex: Connection opened.');
            console.log('Bitmex: Connection opened.');
        });

        client.on('close', () => {
            logger.info('Bitmex: Connection closed.');
            console.log('Bitmex: Connection closed.');
        });

        const me = this;

        client.on('end', () => {
            logger.info('Bitmex: Connection end.');
            console.log('Bitmex: Connection end.');

            // retry connecting after some second to not bothering on high load
            setTimeout(() => {
                me.start(config, symbols);
            }, 10000);
        });

        symbols.forEach(symbol => {
            const resamples = {};
            let myPeriods = [];

            symbol.periods.forEach(period => {
                if (period !== '15m') {
                    myPeriods.push(period);
                    return;
                }

                myPeriods.push('5m');

                if (!resamples[symbol.symbol]) {
                    resamples[symbol.symbol] = {};
                }

                if (!resamples[symbol.symbol]['5m']) {
                    resamples[symbol.symbol]['5m'] = [];
                }

                resamples[symbol.symbol]['5m'].push('15m');
                console.log('resemples', resamples);
            });
            
            myPeriods = Array.from(new Set(myPeriods));

            myPeriods.forEach(period => {
                // for bot init prefill data: load latest candles from api
                this.queue.add(async () => {
                    let body = {};
                    try {
                        const response = await f(`${me.getBaseUrl()}/api/v1/trade/bucketed?binSize=${period}&partial=false&symbol=${symbol.symbol}&count=20&reverse=true`);
                        if (response.ok) { // res.status >= 200 && res.status < 300
                            body = await response.json();
                        } else {
                            return;
                        }
                    } catch(err) {
                        console.log(`Bitmex: Candle backfill error: ${String(err)}`);
                        logger.error(`Bitmex: Candle backfill error: ${String(err)}`);
                        return;
                    }
                    
                    if (!Array.isArray(body)) {
                        console.log(`Bitmex: Candle backfill2 error: ${JSON.stringify(body)}`);
                        logger.error(`Bitmex Candle backfill error: ${JSON.stringify(body)}`);
                        return;
                    }

                    const candleSticks = response.map(candle => {
                        return new Candlestick(
                            moment(candle.timestamp).format('X'),
                            candle.open,
                            candle.high,
                            candle.low,
                            candle.close,
                            candle.volume
                        );
                    });

                    await this.candleImporter.insertThrottledCandles(
                        candleSticks.map(candle => {
                            return ExchangeCandlestick.createFromCandle(this.getName(), symbol.symbol, period, candle);
                        })
                    );

                    if (
                        resamples[symbol.symbol] &&
                        resamples[symbol.symbol][period] &&
                        resamples[symbol.symbol][period].length > 0
                    ) {
                        resamples[symbol.symbol][period].forEach(async periodTo => {
                            const resampledCandles = resample.resampleMinutes(
                                candleSticks.slice(),
                                resample.convertPeriodToMinute(periodTo) // 15m > 15
                            );

                            const candles = resampledCandles.map(candle => {
                                return ExchangeCandlestick.createFromCandle(this.getName(), symbol.symbol, periodTo, candle);
                            });

                            await this.candleImporter.insertThrottledCandles(candles);
                        });
                    }
                });

                // // listen for new incoming candles
                // client.addStream(symbol.symbol, `tradeBin${period}`, async candles => {
                // // we need a force reset; candles are like queue
                // const myCandles = candles.slice();
                // candles.length = 0;

                // const candleSticks = myCandles.map(candle => {
                //     return new Candlestick(
                //     moment(candle.timestamp).format('X'),
                //     candle.open,
                //     candle.high,
                //     candle.low,
                //     candle.close,
                //     candle.volume
                //     );
                // });

                // await this.candleImporter.insertThrottledCandles(
                //     candleSticks.map(candle => {
                //     return ExchangeCandlestick.createFromCandle(this.getName(), symbol.symbol, period, candle);
                //     })
                // );

                // if (
                //     resamples[symbol.symbol] &&
                //     resamples[symbol.symbol][period] &&
                //     resamples[symbol.symbol][period].length > 0
                // ) {
                //     resamples[symbol.symbol][period].forEach(async periodTo => {
                //     await me.candlestickResample.resample(this.getName(), symbol.symbol, period, periodTo, true);
                //     });
                // }
                // });
            });

            client.addStream(symbol.symbol, 'quote', (data, sym, tableName) => {
                //quote: Array
                if (!data.length) return;
                const quote = data[data.length - 1]; //the last data element is the newest quote
                
                eventEmitter.emit('ticker',
                    new TickerEvent(
                        this.getName(),
                        symbol.symbol,
                        (this.tickers[symbol.symbol] = new Ticker(
                            this.getName(),
                            symbol.symbol,
                            moment().format('X'),
                            quote.bidPrice,
                            quote.bidSize,
                            quote.askPrice,
                            quote.askSize
                        ))
                    )
                );
            });

            // client.addStream(symbol.symbol, 'instrument', instruments => {
            //     instruments.forEach(instrument => {
            //         // console.log('Q', instrument);
            //         tickSizes[symbol.symbol] = instrument.lastPrice;
            //         // console.log('instrument.tickSize', instrument.tickSize);
            //         lotSizes[symbol.symbol] = instrument.lotSize;
                    // console.log('instrument.lotSize', instrument.lotSize);
                    // console.log('instrument.tickSize', instrument.tickSize);
                    // console.log('instrument.prevClosePrice', instrument.prevClosePrice); //31691.21
                    // console.log('instrument.isInverse', instrument.isInverse);
                    // console.log('instrument.bidPrice', instrument.bidPrice);
                    // console.log('instrument.askPrice', instrument.askPrice);
                    // console.log('instrument.volume', instrument.volume);
                    // console.log('instrument.volume24h', instrument.volume24h);
                    // console.log('instrument.lastPrice', instrument.lastPrice);
                    // console.log('instrument.lastPrice', instrument.lastPrice);

                    // if (instrument.isInverse && !this.inversedSymboles.includes(symbol.symbol)) {
                    //     this.inversedSymboles.push(symbol.symbol);
                    // }

                    // eventEmitter.emit('ticker',
                    //     new TickerEvent(
                    //         this.getName(),
                    //         symbol.symbol,
                    //         (this.tickers[symbol.symbol] = new Ticker(
                    //             this.getName(),
                    //             symbol.symbol,
                    //             moment().format('X'),
                    //             instrument.bidPrice,
                    //             instrument.askPrice,
                    //             instrument.lotSize
                    //         ))
                    //     )
                    // );
                // });
            // });

            /*
                    * This stream alerts me of any executions of my orders. The results of the executions are seen in the postions stream

                    client.addStream(symbol['symbol'], 'execution', (data, symbol, tableName) => {
                    })
                    */

            /*
                Disable: huge traffic with no use case right now
                var lastTime = moment().format('X');

                client.addStream(symbol['symbol'], 'orderBook10', (books) => {
                    let s = moment().format('X');

                    // throttle orderbook; updated to often
                    if ((lastTime - s) > -5) {
                        return;
                    }

                    lastTime = s;

                    books.forEach(function(book) {
                        eventEmitter.emit('orderbook', new OrderbookEvent(
                            'bitmex',
                            symbol['symbol'],
                            new Orderbook(book['bids'].map(function(item) {
                                return {'price': item[0], 'size': item[1]}
                            }), book['asks'].map(function(item) {
                                return {'price': item[0], 'size': item[1]}
                            }))
                        ));
                    })
                });
                */
        });

        if (this.apiKey && this.apiSecret) {
            // in addition to websocket also try to catch positions via API; run in directly and in interval
            // const apiOrderInterval = _.get(config, 'extra.bitmex_rest_order_sync', 45000);
            // if (apiOrderInterval > 5000) {
            //     setInterval(
            //         (function f() {
            //             me.syncPositionViaRestApi();
            //             me.syncOrdersViaRestApi();
            //             return f;
            //         })(), apiOrderInterval
            //     );
            // }

            client.addStream('*', 'order', orders => {
                console.log(`Bitmex orders: ${orders}`);
                // for (const order of Bitmex.createOrders(orders)) {
                // this.orders[order.id] = order;
                // }
            });

            // open position listener; provides only per position updates; no overall update
            client.addStream('*', 'position', positions => {
                console.log(`Bitmex positions: ${positions}`);
                // me.deltaPositionsUpdate(positions);
            });
        } else {
            console.log('Bitmex: Starting as anonymous; no trading possible');
            this.logger.info('Bitmex: Starting as anonymous; no trading possible');
        }
    }

    order(order) {
        const data = Bitmex.createOrderBody(order);
    
        const verb = 'POST';
        const path = '/api/v1/order';
        const expires = new Date().getTime() + 60 * 1000; // 1 min in the future
        const postBody = JSON.stringify(data);
        const signature = crypto
            .createHmac('sha256', this.apiSecret)
            .update(verb + path + expires + postBody)
            .digest('hex');
    
        const headers = {
            'content-type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'api-expires': expires,
            'api-key': this.apiKey,
            'api-signature': signature
        };
    
        const { logger } = this;
        const me = this;
        return new Promise(async (resolve, reject) => {
            // update leverage for pair position
            await this.updateLeverage(order.symbol);
    
          const result = await this.requestClient.executeRequestRetry(
            {
              headers: headers,
              url: this.getBaseUrl() + path,
              method: verb,
              body: postBody
            },
            result => {
              return result && result.response && result.response.statusCode === 503;
            },
            this.retryOverloadMs,
            this.retryOverloadLimit
          );
    
          const { error } = result;
          const { body } = result;
    
          if (error) {
            logger.error(`Bitmex: Invalid order update request:${JSON.stringify({ error: error, body: body })}`);
            reject();
    
            return;
          }
    
          if (result.response && result.response.statusCode >= 400 && result.response.statusCode < 500) {
            logger.error(`Bitmex: Invalid order created request cancel ordering:${JSON.stringify({ body: body })}`);
    
            resolve(ExchangeOrder.createCanceledFromOrder(order));
            return;
          }
    
          const orderResponse = JSON.parse(body);
          if (orderResponse.error) {
            logger.error(`Bitmex: Invalid order created request:${JSON.stringify({ body: body })}`);
    
            reject();
            return;
          }
    
          logger.info(`Bitmex: Order created:${JSON.stringify({ body: body })}`);
    
          const orders = Bitmex.createOrders([orderResponse]);
          orders.forEach(order => {
            me.triggerOrder(order);
          });
    
          resolve(orders[0]);
        });
    }

    static createOrderBody(order) {
        if (!order.getAmount() && !order.getPrice() && !order.getSymbol()) {
            throw 'Invalid amount for update';
        }
    
        let orderType;
        const ourOrderType = order.getType();
        if (!ourOrderType) {
            orderType = 'Limit';
        } else if (ourOrderType === Order.TYPE_LIMIT) {
            orderType = 'Limit';
        } else if (ourOrderType === Order.TYPE_STOP) {
            orderType = 'Stop';
        } else if (ourOrderType === Order.TYPE_MARKET) {
            orderType = 'Market';
        }
    
        if (!orderType) {
            throw 'Invalid order type';
        }
    
        const body = {
            symbol: order.getSymbol(),
            orderQty: order.getAmount(),
            ordType: orderType,
            text: 'Powered by your awesome crypto-bot watchdog'
        };
    
        const execInst = [];
        if (order.options && order.options.close === true && orderType === 'Limit') {
            execInst.push('ReduceOnly');
        }
    
        if (order.options && order.options.close === true && orderType === 'Stop') {
            execInst.push('Close');
        }
    
        // we need a trigger; else order is filled directly on: "market sell [short]"
        if (orderType === 'Stop') {
          execInst.push('LastPrice');
        }
    
        if (order.isPostOnly()) {
          execInst.push('ParticipateDoNotInitiate');
        }
    
        if (execInst.length > 0) {
          body.execInst = execInst.join(',');
        }
    
        if (orderType === 'Stop') {
          body.stopPx = order.getPrice();
        } else if (orderType === 'Limit') {
          body.price = order.getPrice();
        }
    
        body.side = order.isShort() ? 'Sell' : 'Buy';
    
        if (order.getId()) {
          body.clOrdID = order.getId();
        }
    
        return body;
    }

    // async getPositions() {
    //     const results = [];
    
    //     for (const x in this.positions) {
    //         let position = this.positions[x];
    //         if (position.entry && this.tickers[position.symbol]) {
    //             if (position.side === 'long') {
    //                 position = Position.createProfitUpdate(
    //                     position,
    //                     (this.tickers[position.symbol].bid / position.entry - 1) * 100
    //                 );
    //             } else if (position.side === 'short') {
    //                 position = Position.createProfitUpdate(
    //                     position,
    //                     (position.entry / this.tickers[position.symbol].ask - 1) * 100
    //                 );
    //             }
    //         }
    
    //         results.push(position);
    //     }
    
    //     return results;
    // }

    // async getPositionForSymbol(symbol) {
    //     for (const position of await this.getPositions()) {
    //         if (position.symbol === symbol) {
    //             return position;
    //         }
    //     }
    
    //     return undefined;
    // }
    static formatVolume(volume) {
        return Math.trunc(volume);
    }
};
