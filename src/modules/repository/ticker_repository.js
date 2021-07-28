const moment = require('moment');
const Ticker = require('../../dict/ticker');

module.exports = class TickerRepository {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }

    // updateTickers(tickers) {
    //     return new Promise(resolve => {
    //         const upsert = this.db.prepare(
    //         'INSERT INTO tickers(exchange, symbol, bidPrice, bidSize, askPrice, askSize, income_at) VALUES ($exchange, $symbol, $bidPrice, $bidSize, $askPrice, $askSize  $income_at) ' +
    //             'ON CONFLICT(exchange, symbol) DO UPDATE SET bidPrice=$bidPrice, bidSize=$bidSize, askPrice=$askPrice, askSize=$askSize, income_at=$income_at'
    //         );

    //         this.db.transaction(() => {
    //             tickers.forEach(ticker => {
    //                 const parameters = {
    //                     exchange: ticker.exchange,
    //                     symbol: ticker.symbol,
    //                     bidPrice: ticker.bidPrice,
    //                     bidSize: ticker.bidSize,
    //                     askPrice: ticker.askPrice,
    //                     askSize: ticker.askSize,
    //                     income_at: new Date().getTime()
    //                 };
        
    //                 upsert.run(parameters);
    //             });
    //         })();

    //         resolve();
    //     });
    // }

    insertTickers(tickers, period = 500) {
        return new Promise(resolve => {
            const upsert = this.db.prepare(
                'INSERT INTO tickers(exchange, symbol, bidPrice, bidSize, askPrice, askSize, period, close, income_at) VALUES ($exchange, $symbol, $bidPrice, $bidSize, $askPrice, $askSize, $period, $close, $income_at) '
            );

            this.db.transaction(() => {
                tickers.forEach(ticker => {
                    const parameters = {
                        exchange: ticker.exchange,
                        symbol: ticker.symbol,
                        bidPrice: ticker.bidPrice,
                        bidSize: ticker.bidSize,
                        askPrice: ticker.askPrice,
                        askSize: ticker.askSize,
                        period: period,
                        close: ticker.close,
                        income_at: new Date().getTime() //ticker.createdAt.getTime()
                    };
        
                    upsert.run(parameters);
                });
            })();

            resolve();
        });
    }

    cleanOldLogEntries(days = 14) {
        return new Promise(resolve => {
            const stmt = this.db.prepare('DELETE FROM tickers WHERE income_at < $income_at');

            stmt.run({
                income_at: moment()
                .subtract(days, 'days')
                .unix()
            });

            resolve();
        });
    }

    getTickerInWindow(exchange, symbol, days = 14) {
        return new Promise(resolve => {
            const stmt = this.db.prepare(
                'SELECT * from tickers WHERE exchange = ? AND symbol = ? AND income_at > ? order by income_at DESC LIMIT 1000'
            );

            const income_at = moment().subtract(days, 'days').unix() * 1000;

            const result = stmt
                .all([exchange, symbol, income_at])
                .map(row => {
                    return new Ticker(row.exchange, row.symbol, row.income_at, row.bid, row.ask); //TODO
                });

            resolve(result);
        });
    }

    getMultipleTickers(pairs, period, limit, time) {
        return new Promise(resolve => {
            const parameters = {
                limit: limit,
                time: time,
                period: period
            };
            
            const sql = `SELECT * FROM tickers WHERE (exchange, symbol) IN (VALUES ${pairs
                .map(pair => `($exchange_${pair.exchange}, $symbol_${pair.symbol})`)
                .join(', ')}) AND period=$period AND income_at > $time ORDER BY income_at ASC LIMIT $limit`

            pairs.forEach(pair => {
                parameters[`exchange_${pair.exchange}`] = pair.exchange;
                parameters[`symbol_${pair.symbol}`] = pair.symbol;
            });

            const stmt = this.db.prepare(sql);
            resolve(stmt.all(parameters));
        });
    }
};
