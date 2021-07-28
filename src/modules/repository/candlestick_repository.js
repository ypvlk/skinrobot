const Candlestick = require('../../dict/candlestick');

module.exports = class CandlestickRepository {
    constructor(db) {
        this.db = db;
    }

    insertCandles(exchangeCandlesticks) {
        return new Promise(resolve => {
            const upsert = this.db.prepare(
                'INSERT INTO candlesticks(exchange, symbol, period, time, open, high, low, close, volume) VALUES ($exchange, $symbol, $period, $time, $open, $high, $low, $close, $volume) ' +
                'ON CONFLICT(exchange, symbol, period, time) DO UPDATE SET open=$open, high=$high, low=$low, close=$close, volume=$volume'
            );

            this.db.transaction(() => {
                exchangeCandlesticks.forEach(exchangeCandlestick => {
                    const parameters = {
                        exchange: exchangeCandlestick.exchange,
                        symbol: exchangeCandlestick.symbol,
                        period: exchangeCandlestick.period,
                        time: exchangeCandlestick.time,
                        open: exchangeCandlestick.open,
                        high: exchangeCandlestick.high,
                        low: exchangeCandlestick.low,
                        close: exchangeCandlestick.close,
                        volume: exchangeCandlestick.volume
                    };

                    upsert.run(parameters);
                });
            })();

            resolve();
        });
    }

    getCandlesInWindow(exchange, symbol, period, start, end, limit = 10) {
        console.log('args', arguments);
        return new Promise(resolve => {
            const stmt = this.db.prepare(
                'SELECT * from candlesticks where exchange = ? AND symbol = ? and period = ? and time > ?  and time < ? order by time DESC LIMIT ?'
            );

            const result = stmt
                .all([exchange, symbol, period, Math.round(start.getTime() / 1000), Math.round(end.getTime() / 1000), limit])
                .map(row => {
                    return new Candlestick(row.time, row.open, row.high, row.low, row.close, row.volume);
                });

            resolve(result);
        });
    }

    getExchangePairs() {
        return new Promise(resolve => {
            const stmt = this.db.prepare(
                'SELECT exchange, symbol FROM candlesticks group by exchange, symbol order by exchange, symbol'
            );

            resolve(stmt.all());
        });
    }

    getMultiplePairCandles(pairs, period, start, end, limit = 10) {
        return new Promise(resolve => {
            const parameters = {
                limit: limit,
                period: period,
                start: Math.round(new Date(start).getTime() / 1000),
                end: Math.round(new Date(end).getTime() / 1000)
            };
            
            const sql = `SELECT * FROM candlesticks WHERE (exchange, symbol) IN (VALUES ${pairs
                .map(pair => `($exchange_${pair.exchange}, $symbol_${pair.symbol})`)
                .join(', ')}) AND period=$period AND time >= $start AND time <= $end LIMIT $limit`

            pairs.forEach(pair => {
                parameters[`exchange_${pair.exchange}`] = pair.exchange;
                parameters[`symbol_${pair.symbol}`] = pair.symbol;
            });

            const stmt = this.db.prepare(sql);
            resolve(stmt
                .all(parameters)
                .map(item => ({
                    symbol: item.exchange + '.' + item.symbol.toLowerCase(),
                    id: item.id,
                    period: item.period,
                    time: item.time,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                    volume: item.volume
                }))
            );
        });
    }

    getCandlesSelectivelyOnTime(pairs, period, times) {
        return new Promise(resolve => {
            const parameters = {};

            // const times = ['1609718400', '1610409600', '1610841600'];

            const sql = `SELECT * FROM candlesticks WHERE ${pairs
                .map(pair => times
                    .map(time => 
                        `(exchange=$exchange_${pair.exchange} AND symbol=$symbol_${pair.symbol} AND period=$period_${period} AND time=$time_${time})`)
                    .join(' OR ')
                ).join(' OR ')
            }`;
            
            pairs.forEach(pair => {
                parameters[`exchange_${pair.exchange}`] = pair.exchange;
                parameters[`symbol_${pair.symbol}`] = pair.symbol;
                parameters[`period_${period}`] = period;
                times.forEach(time => {
                    parameters[`time_${time}`] = time;
                })
            });
            
            const stmt = this.db.prepare(sql);
            resolve(stmt
                .all(parameters)
                .map(item => ({
                    symbol: item.exchange + '.' + item.symbol,//.toLowerCase(),
                    id: item.id,
                    period: item.period,
                    time: item.time,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                    volume: item.volume
                }))
            );
        });
    }



    
    getLookbacksForPair(exchange, symbol, period, limit = 750, olderThen = undefined) {
        return new Promise(resolve => {
        const olderThenFilter = olderThen ? ' AND time <= :time ' : '';

        const stmt = this.db.prepare(
            `SELECT * from candlesticks WHERE exchange = $exchange AND symbol = $symbol AND period = $period ${olderThenFilter} order by time DESC LIMIT $limit`
        );

        const parameters = {
            exchange: exchange,
            symbol: symbol,
            period: period,
            limit: limit
        };

        if (olderThen) {
            parameters.time = olderThen;
        }

        const result = stmt.all(parameters).map(row => {
            return new Candlestick(row.time, row.open, row.high, row.low, row.close, row.volume);
        });

        resolve(result);
        });
    }

    getLookbacksSince(exchange, symbol, period, start) {
        return new Promise(resolve => {
        const stmt = this.db.prepare(
            'SELECT * from candlesticks where exchange = ? AND symbol = ? and period = ? and time > ? order by time DESC'
        );

        const result = stmt.all([exchange, symbol, period, start]).map(row => {
            return new Candlestick(row.time, row.open, row.high, row.low, row.close, row.volume);
        });

        resolve(result);
        });
    }

    getCandlePeriods(exchange, symbol) {
        return new Promise(resolve => {
            const stmt = this.db.prepare(
                `SELECT period from candlesticks where exchange = ? AND symbol = ? AND time > ? group by period ORDER BY period`
            );

            // only fetch candles newer the 5 days
            const since = Math.round(new Date(new Date() - 1000 * 60 * 60 * 24 * 5).getTime() / 1000);

            resolve(stmt.all([exchange, symbol, since]).map(row => row.period));
        });
    }
};
