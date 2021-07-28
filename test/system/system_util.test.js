const SystemUtil = require('../../src/modules/system/system_util');

describe('#system util test', function() {

    test('test configuration extraction faild', () => {
        const systemUtil = new SystemUtil({
            root: 'test123',
            root2: undefined,
            webserver: {
                port: 8080
            }
        });

        expect(systemUtil.getConfig('webserver.port')).toBe(8080);
        expect(systemUtil.getConfig('root')).toBe('test123');
        expect(systemUtil.getConfig('root2')).toBeUndefined();
        expect(systemUtil.getConfig('root2', 'test')).toBe('test');
        expect(systemUtil.getConfig('UNKONWN')).toBeUndefined();
        expect(systemUtil.getConfig('UNKONWN', 'test')).toBe('test');
    });
});
