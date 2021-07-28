module.exports = class Signal {
    constructor(exchange, symbol, side, size, price, orderType, amount, orderID, action) {
        this.exchange = exchange;
        this.symbol = symbol;
        this.side = side;
        this.size = size;
        this.price = price;
        this.orderType = orderType;
        this.amount = amount;
        this.orderID = orderID;
        this.action = action;
    }

    getOrderID() {
        return this.orderID;
    }

    getAmount() {
        return this.amount;
    }

    getExchange() {
        return this.exchange;
    }

    getSymbol() {
        return this.symbol;
    }

    getSide() {
        return this.side;
    }

    getSize() {
        return this.size;
    }

    getPrice() {
        return this.price;
    }

    getOrderType() {
        return this.orderType
    }

    getAction() {
        return this.action;
    }
};