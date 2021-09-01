

module.exports = class MeanReversionRepository {
    constructor(db) {
        this.db = db;
    }

    insertData(data) {
        return new Promise(resolve => {
            const parameters = {
                lead_exchange: data.lead_exchange,
                lead_symbol: data.lead_symbol,
                lead_change: data.lead_change,
                lead_price: data.lead_price,
                lead_side: data.lead_side,
                lead_tier: data.lead_tier,
                lead_amount: data.lead_amount,
                driven_exchange: data.driven_exchange,
                driven_symbol: data.driven_symbol,
                driven_change: data.driven_change,
                driven_price: data.driven_price,
                adj_driven_change: data.adj_driven_change,
                driven_side: data.driven_side,
                driven_tier: data.driven_tier,
                driven_amount: data.driven_amount,
                delta: data.delta,
                signal: data.signal,
                balance: data.balance,
                balance_comm: data.balance_comm,
                income_at: Math.floor(Date.now() / 1000)
            };
    
            this.db
                .prepare(
                    `INSERT INTO mean_reversion (lead_exchange, lead_symbol, lead_change, lead_price, lead_side, lead_tier, lead_amount, driven_exchange, driven_symbol, driven_change, driven_price, adj_driven_change, driven_side, driven_tier, driven_amount, delta, signal, balance, balance_comm, income_at) VALUES ($lead_exchange, $lead_symbol, $lead_change, $lead_price, $lead_side, $lead_tier, $lead_amount, $driven_exchange, $driven_symbol, $driven_change, $driven_price, $adj_driven_change, $driven_side, $driven_tier, $driven_amount, $delta, $signal, $balance, $balance_comm, $income_at)`
                    )
                .run(parameters);

            resolve();
        });
    }

    getData(leadExchange, leadSymbol, drivenExchange, drivenSymbol, startTime, endTime, limit = 30000) {
        return new Promise(resolve => {
            //TODO
            //add logic with time


            const stmt = this.db.prepare(
                'SELECT * FROM mean_reversion WHERE (lead_exchange = ? AND lead_symbol = ?) AND (driven_exchange = ? AND driven_symbol = ?) LIMIT ?'
            );

            const result = stmt.all([leadExchange, leadSymbol, drivenExchange, drivenSymbol, limit])
            resolve(result);
        });
    }

};
