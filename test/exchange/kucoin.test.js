const Kucoin = require('../../src/exchange/kucoin');


describe('#Kucoin exchange', function() {

    test('test method formatVolume faild', () => {
        expect(Kucoin.formatVolume(123.123)).toBe(123);
        expect(Kucoin.formatVolume(0.123)).toBe(0);
        expect(Kucoin.formatVolume(123)).toBe(123);
    });

    test('test method formatPeriod faild', () => {
        expect(Kucoin.formatPeriod('1d')).toBe('1day');
        expect(Kucoin.formatPeriod('10d')).toBe('10day');
        expect(Kucoin.formatPeriod('1m')).toBe('1min');
        expect(Kucoin.formatPeriod('15m')).toBe('15min');
    });

    test('test method formatSymbol faild', () => {
        expect(Kucoin.formatSymbol('BTCUSD')).toBe('BTC-USD');
        expect(Kucoin.formatSymbol('BTCUSDT')).toBe('BTC-USDT');
        expect(Kucoin.formatSymbol('USDTUSD')).toBe('USDT-USD');
        expect(Kucoin.formatSymbol('USDUSDT')).toBe('USD-USDT');
        expect(Kucoin.formatSymbol('SECUSDT')).toBe('SEC-USDT');
        expect(Kucoin.formatSymbol('SECMUSDT')).toBe('SECM-USDT');
        expect(Kucoin.formatSymbol('SECBTC')).toBe('SEC-BTC');
        expect(Kucoin.formatSymbol('SECMBTC')).toBe('SECM-BTC');
        expect(Kucoin.formatSymbol('ETHUSDT')).toBe('ETH-USDT');
        expect(Kucoin.formatSymbol('ETHBTC')).toBe('ETH-BTC');
        expect(Kucoin.formatSymbol('SECETH')).toBe('SEC-ETH');
        expect(Kucoin.formatSymbol('SECMETH')).toBe('SECM-ETH');
    });
});