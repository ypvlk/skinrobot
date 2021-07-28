const Binance = require('./binance');

module.exports = class BinanceTestnet extends Binance {
    getName() {
        return 'binance_testnet';
    }

    getBaseUrl() {
        return 'https://testnet.bitmex.com';
    }
};
