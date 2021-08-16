const BinanceFutures = require('../../src/exchange/binance_futures');


describe('#Binance Futures exchange', function() {

    test('test method convertOrderSymbol faild', () => {
        expect(BinanceFutures.convertOrderSymbol('BTCUSDT')).toBe('BTC/USDT');
        expect(BinanceFutures.convertOrderSymbol('ETHHBUSD')).toBe('ETHH/BUSD');
        expect(BinanceFutures.convertOrderSymbol('HBUSD')).toBe('H/BUSD');
        expect(BinanceFutures.convertOrderSymbol('USDT')).toBeUndefined();
        expect(BinanceFutures.convertOrderSymbol('')).toBeUndefined();
    });

    test('test method calcPnLPercent faild', () => {
        expect(BinanceFutures.calcPnLPercent(null, 2)).toBeUndefined();
        expect(BinanceFutures.calcPnLPercent(2, null)).toBeUndefined();
        expect(BinanceFutures.calcPnLPercent(2, 0)).toBeUndefined();
        expect(BinanceFutures.calcPnLPercent(1, 2)).toBe(50);
        expect(BinanceFutures.calcPnLPercent()).toBeUndefined();
    });

    // test('test method formatOrderAction faild', () => {
    //     expect(BinanceFutures.formatOrderAction('NEW')).toBe('SAVE');
    //     expect(BinanceFutures.formatOrderAction('CANCELED')).toBe('DELETE');
    //     expect(BinanceFutures.formatOrderAction('abc')).toBeUndefined();
    //     expect(BinanceFutures.formatOrderAction({})).toBeUndefined();
    //     expect(BinanceFutures.formatOrderAction(123)).toBeUndefined();
    //     expect(BinanceFutures.formatOrderAction([])).toBeUndefined();
    // });
});