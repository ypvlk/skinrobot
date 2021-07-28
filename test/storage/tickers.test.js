const moment = require('moment');
const Tickers = require('../../src/storage/tickers');
const Ticker = require('../../src/dict/ticker');

describe('#tickers storage', function() {

    test('instance should have methods: set, get, all, getIfUpToDate', () => {
        const tickers = new Tickers();

        expect(tickers.set).toBeDefined();
        expect(tickers.get).toBeDefined();
        expect(tickers.all).toBeDefined();
        expect(tickers.getIfUpToDate).toBeDefined();

    });

    test('test getting update tickers', () => {
        const tickers = new Tickers();
        const ticker = new Ticker('bitfinex', 'BTCUSD', 1234, 1337, 2, 1338, 5);

        tickers.set(ticker);
        
        ticker.createdAt = moment()
            .subtract(5000, 'ms')
            .toDate();

        expect(tickers.get('bitfinex', 'BTCUSD').bidPrice).toBe(1337);
        expect(tickers.get('bitfinex', 'BTCUSD').bidSize).toBe(2);
        expect(tickers.get('bitfinex', 'BTCUSD').askPrice).toBe(1338);
        expect(tickers.get('bitfinex', 'BTCUSD').askSize).toBe(5);

        expect(tickers.get('unknown', 'BTCUSD')).toBeNull();

        expect(tickers.getIfUpToDate('bitfinex', 'BTCUSD', 1000)).toBeUndefined();
        expect(tickers.getIfUpToDate('bitfinex', 'BTCUSD', 7000).bidPrice).toBe(1337);
    });
});
