
module.exports = class ExchangeOrder {
    static get STATUS_OPEN() {
        return 'open';
    }

    static get STATUS_DONE() {
        return 'done';
    }

    static get STATUS_CANCELED() {
        return 'canceled';
    }

    static get STATUS_REJECTED() {
        return 'rejected';
    }

    static get TYPE_LIMIT() {
        return 'limit';
    }

    static get TYPE_STOP() {
        return 'stop';
    }

    // think use market
    static get TYPE_STOP_LIMIT() {
        return 'stop_limit';
    }

    static get TYPE_MARKET() {
        return 'market';
    }

    static get TYPE_TRAILING_STOP() {
        return 'trailing_stop';
    }

    static get TYPE_UNKNOWN() {
        return 'unknown';
    }

    static get SIDE_LONG() {
        return 'buy';
    }

    static get SIDE_SHORT() {
        return 'sell';
    }

    constructor(
        id,
        exchange,
        symbol,
        status,
        price,
        amount,
        side,
        type,
        updatedAt
    ) {

        if (side !== ExchangeOrder.SIDE_LONG && side !== ExchangeOrder.SIDE_SHORT) {
            throw new Error(`Invalid exchange order direction given:${side}`);
        }

        if (
            ![
                ExchangeOrder.TYPE_LIMIT,
                ExchangeOrder.TYPE_STOP_LIMIT,
                ExchangeOrder.TYPE_MARKET,
                ExchangeOrder.TYPE_UNKNOWN,
                ExchangeOrder.TYPE_STOP,
                ExchangeOrder.TYPE_TRAILING_STOP
            ].includes(type)
        ) {
            throw new Error(`Invalid exchange order type: ${type}`);
        }

        this.id = id,
        this.exchange = exchange,
        this.symbol = symbol,
        this.status = status,
        this.price = price,
        this.amount = amount,
        this.side = side,
        this.type = type,
        this.updatedAt = updatedAt
    }

    getID() {
        return this.id;
    }

    getExchange() {
        return this.exchange;
    }

    getSymbol() {
        return this.symbol;
    }

    getPrice() {
        return this.price;
    }

    getAmount() {
        return this.amount;
    }

    getSide() {
        return this.side;
    }

    isLong() {
        return this.side === ExchangeOrder.SIDE_LONG;
    }

    isShort() {
        return this.side === ExchangeOrder.SIDE_SHORT;
    }

    getType() {
        return this.type;
    }

    getStatus() {
        return this.status;
    }
};