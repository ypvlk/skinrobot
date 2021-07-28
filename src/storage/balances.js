
module.exports = class Balances {
    constructor() {
        this.balances = {};
    }

    set(balance) {
        this.balances[`${balance.exchange}.${balance.asset}`] = balance;
    }

    get(exchange, asset) {
        return this.balances[`${exchange}.${asset}`] || null;
    }

    all() {
        return this.balances;
    }
};
