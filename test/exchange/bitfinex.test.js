const Bitfinex = require('../../src/exchange/bitfinex');


describe('#Bitfinex exchange', function() {

    test('test method formatPeriod faild', () => {
        expect(Bitfinex.formatPeriod('1d')).toBe('1D');
        expect(Bitfinex.formatPeriod('1D')).toBe('1D');
        expect(Bitfinex.formatPeriod('1m')).toBe('1m');
        expect(Bitfinex.formatPeriod('1M')).toBe('1M');
    });
});