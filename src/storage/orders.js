
module.exports = class Orders {
    constructor() {
        this.orders = {};
    }

    set(order) {
        this.orders[`${order.exchange}.${order.symbol}.${order.order.status}`] = order.order;
    }

    get(exchange, symbol, status) {
        return this.orders[`${exchange}.${symbol}.${status}`] || null;
    }

    del(exchange, symbol, status) {
        delete this.orders[`${exchange}.${symbol}.${status}`];
        return;
    }

    all() {
        return this.orders;
    }
};
