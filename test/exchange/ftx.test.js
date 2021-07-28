const Ftx = require('../../src/exchange/ftx');


describe('#Ftx exchange', function() {

    test('test method formatPeriod faild', () => {
        expect(Ftx.formatPeriod('1d')).toBe(86400);
        expect(Ftx.formatPeriod('10d')).toBe(864000);
        expect(Ftx.formatPeriod('1m')).toBe(60);
        expect(Ftx.formatPeriod('5m')).toBe(300);
        expect(Ftx.formatPeriod('1D')).toBeUndefined();
        expect(Ftx.formatPeriod('1M')).toBeUndefined();
    });

    test('test method formatSymbol faild', () => {
        expect(Ftx.formatSymbol('BTCUSD')).toBe('BTC/USD');
        expect(Ftx.formatSymbol('BTCUSDT')).toBe('BTC/USDT');
        expect(Ftx.formatSymbol('USDTUSD')).toBe('USDT/USD');
        expect(Ftx.formatSymbol('USDUSDT')).toBe('USD/USDT');
        expect(Ftx.formatSymbol('SECUSDT')).toBe('SEC/USDT');
        expect(Ftx.formatSymbol('SECMUSDT')).toBe('SECM/USDT');
        expect(Ftx.formatSymbol('SECBTC')).toBe('SEC/BTC');
        expect(Ftx.formatSymbol('SECMBTC')).toBe('SECM/BTC');
        expect(Ftx.formatSymbol('ETHUSDT')).toBe('ETH/USDT');
        expect(Ftx.formatSymbol('ETHBTC')).toBe('ETH/BTC');
        expect(Ftx.formatSymbol('SECETH')).toBe('SEC/ETH');
        expect(Ftx.formatSymbol('SECMETH')).toBe('SECM/ETH');

        expect(Ftx.formatSymbol('SPYUSD')).toBe('SPY/USD');
        expect(Ftx.formatSymbol('GLDUSD')).toBe('GLD/USD');
        expect(Ftx.formatSymbol('SPYBTC')).toBe('SPY/BTC');
        expect(Ftx.formatSymbol('GLDBTC')).toBe('GLD/BTC');
    });
});