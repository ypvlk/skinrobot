const Mathematics = require('../../src/utils/mathematics');

describe('#mathematics util test', function() {

    test('test changesFromClose mathod faild', () => {

        expect(Mathematics.changesFromClose([])).toBeUndefined();
        expect(Mathematics.changesFromClose({})).toBeUndefined();
        expect(Mathematics.changesFromClose('123')).toBeUndefined();
        expect(Mathematics.changesFromClose(1)).toBeUndefined();


        expect(Mathematics.changesFromClose([{close: 123}, {close:124}])).toBeDefined();
        expect(Mathematics.changesFromClose([{close: 123}, {close:124}])).toHaveLength(1);
        expect(Mathematics.changesFromClose([{close: 123}])).toHaveLength(0);
    });

    test('test beta from array of array mathod faild', () => {

        expect(Mathematics.beta([])).toBeUndefined();
        expect(Mathematics.beta({})).toBeUndefined();
        expect(Mathematics.beta('123')).toBeUndefined();
        expect(Mathematics.beta(1)).toBeUndefined();

        expect(Mathematics.beta([[], []])).toBeUndefined();
        expect(Mathematics.beta([], [])).toBeUndefined();
        expect(Mathematics.beta([1], [2], [3])).toBeUndefined();
        expect(Mathematics.beta([[1], [2]])).toHaveLength(2);

        const a = Mathematics.beta([[1, 2], [2]]);
        const b = a[0];
        expect(b.length).toBe(1);

        const c = Mathematics.beta([[1], [2, 3, 4]]);
        const d = c[1];
        expect(d.length).toBe(1);


        // expect(Mathematics.changesFromClose([{close: 123}, {close:124}])).toBeDefined();
        // expect(Mathematics.changesFromClose([{close: 123}, {close:124}])).toHaveLength(1);
        // expect(Mathematics.changesFromClose([{close: 123}])).toHaveLength(0);
    });

});
