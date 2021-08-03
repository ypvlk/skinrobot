const fs = require('fs');

describe('#validate pre deployment files', function() {

    test('test conf.json file is not valid', () => {
        const config = JSON.parse(fs.readFileSync(`${__dirname}/../config/conf.json`, 'utf8'));

        expect(config.webserver.ip).toBe('0.0.0.0');
        expect(typeof config.webserver.port).toBe('number');
    });

    test('test instance.js file is not valid', () => {
        const instances = require(`${__dirname}/../instance.js`);

        expect(instances.symbols.length > 0).toBeTruthy();

        instances.symbols.forEach(symbol => {
            expect(symbol.symbol.length > 0).toBeTruthy();
            expect(symbol.exchange.length > 0).toBeTruthy();
        });
    });
});
