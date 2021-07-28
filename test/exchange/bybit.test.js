const Bybit = require('../../src/exchange/bybit');


describe('#Bybit exchange', function() {

    test('test method formatPeriod faild', () => {
        expect(Bybit.formatPeriod('1d')).toBe('D');
        expect(Bybit.formatPeriod('10d')).toBe('D');
        expect(Bybit.formatPeriod('d')).toBe('D');
        expect(Bybit.formatPeriod('D')).toBe('D');
        expect(Bybit.formatPeriod('1m')).toBe('1');
        expect(Bybit.formatPeriod('15m')).toBe('15');
    });
});