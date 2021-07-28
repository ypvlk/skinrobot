module.exports = class Candlestick {
    constructor(time, open, high, low, close, volume, close_time) {
        this.time = time;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
        this.close_time = close_time;
    }

    // getArray() {
    //     return {
    //         time: this.time,
    //         open: this.open,
    //         high: this.high,
    //         low: this.low,
    //         close: this.close,
    //         volume: this.volume
    //     };
    // }
};