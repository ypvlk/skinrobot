
module.exports = class Balance {
    constructor(exchange, asset, balance) { 
        this.exchange = exchange,
        this.asset = asset,
        this.balance = balance,
        this.updatedAt = new Date() / 1
    }
};