const moment = require('moment');
// const Signal = require('../../dict/signal');

module.exports = class SignalRepository {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }

    insertSignals(signals, strategy) {
        return new Promise(resolve => {
            const upsert = this.db.prepare(
                `INSERT INTO signals(exchange, symbol, side, size, price, order_type, strategy, action, income_at) 
                VALUES ($exchange, $symbol, $side, $size, $price, $order_type, $strategy, $action, $income_at) `
            );

            this.db.transaction(() => {
                signals.forEach(signal => {
                    const parameters = {
                        exchange: signal.exchange,
                        symbol: signal.symbol,
                        side: signal.side,
                        size: signal.size,
                        price: signal.price,
                        order_type: signal.orderType,
                        strategy: strategy,
                        action: signal.action,
                        income_at: Math.floor(new Date() / 1000)
                    };
        
                    upsert.run(parameters);
                });
            })();

            resolve();
        });
    }

    getSignalsByStrategy(pair_first, pair_second, strategy, limit = 100000) {
        return new Promise(resolve => {
            const parameters = {
                pair_first: pair_first,
                pair_second: pair_second,
                strategy: strategy,
                limit: limit
            };

            const stmt = this.db.prepare(
                'SELECT * from signals where (symbol = $pair_first AND strategy = $strategy) OR (symbol = $pair_second AND strategy = $strategy) LIMIT $limit'
            );
            
            resolve(stmt.all(parameters));
        });
    }
};
