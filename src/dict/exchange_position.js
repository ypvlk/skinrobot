module.exports = class ExchangePosition {
    /**
     * @param symbol 'BTCUSD'
     * @param side "long" or "short"
     * @param amount negative for short and positive for long entries
     * @param profit Current profit in percent: "23.56"
     * @param updatedAt Item last found or sync
     * @param entry The entry price
     * @param createdAt
     */

    static get SIDE_LONG() {
        return 'long'
    }

    static get SIDE_SHORT() {
        return 'short'
    }
    
    constructor(
        exchange,
        symbol, 
        side, 
        amount, 
        profit, 
        profitPercent,
        updatedAt, 
        entry
    ) {
        if (![
            ExchangePosition.SIDE_LONG, 
            ExchangePosition.SIDE_SHORT
        ].includes(side)) {
            throw new Error(`Invalid exchange position direction given:${side}`);
        }

        if (amount < 0 && side === ExchangePosition.SIDE_LONG) {
            throw new Error(`Invalid exchange position direction amount:${side}`);
        }

        if (amount > 0 && side === ExchangePosition.SIDE_SHORT) {
            throw new Error(`Invalid exchange position direction amount:${side}`);
        }

        this.exchange = exchange,
        this.symbol = symbol;
        this.side = side;
        this.amount = amount;
        this.profit = profit;
        this.profitPercent = profitPercent;
        this.updatedAt = updatedAt;
        this.entry = entry;
        this.createdAt = new Date()
    }

    getProfitPercent() {
        return this.profitPercent;
    }

    getExchange() {
        return this.exchange;
    }

    getSide() {
        return this.side;
    }

    isShort() {
        return this.side === ExchangePosition.SIDE_SHORT;
    }

    isLong() {
        return this.side === ExchangePosition.SIDE_LONG;
    }

    getAmount() {
        return this.amount;
    }

    getSymbol() {
        return this.symbol;
    }

    getProfit() {
        return this.profit;
    }

    getEntry() {
        return this.entry;
    }

    getCreatedAt() {
        return this.createdAt;
    }

    getUpdatedAt() {
        return this.updatedAt;
    }
};
