
//TODO add val
module.exports = class Ticker {
    constructor(exchange, symbol, time, bidPrice, bidSize, askPrice, askSize, close) {
        this.exchange = exchange;
        this.symbol = symbol;
        this.time = time;
        this.bidPrice = bidPrice;
        this.bidSize = bidSize;
        this.askPrice = askPrice;
        this.askSize = askSize;
        this.close = close;
        this.createdAt = new Date();
    }
};