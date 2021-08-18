
module.exports = class Positions {
    constructor() {
        this.positions = {};
    }

    set(position) {
        this.positions[`${position.exchange}.${position.symbol}`] = position.position;
    }

    get(exchange, symbol) {
        return this.positions[`${exchange}.${symbol}`] || null;
    }

    del(exchange, symbol) {
        delete this.positions[`${exchange}.${symbol}`];
        return;
    }

    all() {
        return this.positions;
    }
};
