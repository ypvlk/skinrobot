const _ = require('lodash');

/**
 * The order that should place from our side and sending to remote
 */
module.exports = class Order {
    static get SIDE_LONG() {
        return 'long';
    }

    static get SIDE_SHORT() {
        return 'short';
    }

    static get TYPE_LIMIT() {
        return 'limit';
    }

    static get TYPE_STOP() {
        return 'stop';
    }

    static get TYPE_MARKET() {
        return 'market';
    }

    static get TYPE_TRAILING_STOP() {
        return 'trailing_stop';
    }

    static get TYPE_STOP() {
        return 'stop';
    }

    // think use market
    static get TYPE_STOP_LIMIT() {
        return 'stop_limit';
    }

    constructor(symbol, type, side, amount, price) {
        if (![Order.SIDE_LONG, Order.SIDE_SHORT].includes(side)) {
            throw new Error(`Invalid order side given: ${side}`);
        }

        this.symbol = symbol;
        this.type = type;
        this.side = side;
        this.amount = amount;
        this.price = price;
    }

    getSymbol() {
        return this.symbol;
    }

    isShort() {
        return this.side === Order.SIDE_SHORT ? true : false;
    }

    isLong() {
        return this.side === Order.SIDE_LONG ? true : false;
    }

    getPrice() {
        return this.price ? Math.abs(this.price) : undefined;
    }

    getAmount() {
        return this.amount ? Math.abs(this.amount) : undefined;
    }

    getType() {
        return this.type;
    }
};
