

module.exports = class ActionRepository {
    constructor(db) {
        this.db = db;
    }

    insertActions(actions, incomeAt) {
        return new Promise(resolve => {
            const upsert = this.db.prepare(
                'INSERT INTO actions (exchange, symbol, type, order_type, order_side, order_amount, order_price, income_at) VALUES ($exchange, $symbol, $type, $order_type, $order_side, $order_amount, $order_price, $income_at) '
            );

            this.db.transaction(() => {
                actions.forEach(action => {
                    const parameters = {
                        exchange: action.exchangeName,
                        symbol: action.symbol,
                        type: action.type,
                        order_type: action.order ? action.order.type : '',
                        order_side: action.order ? action.order.side : '',
                        order_amount: action.order ? action.order.amount : 0,
                        order_price: action.order ? action.order.price : 0,
                        income_at: incomeAt
                    };
        
                    upsert.run(parameters);
                });
            })();

            resolve();
        });
    }
};
