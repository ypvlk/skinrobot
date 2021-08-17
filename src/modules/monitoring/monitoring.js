
module.exports = class MonitoringService {
    constructor(
        eventEmitter,
        balancesStorage,
        ordersStorage,
        positionsStorage,
        tickersStorage,
        logger,
        systemUtil,
        instances

    ) {
        this.eventEmitter = eventEmitter;
        this.balancesStorage = balancesStorage;
        this.ordersStorage = ordersStorage;
        this.positionsStorage = positionsStorage;
        this.tickersStorage = tickersStorage;
        this.logger = logger;
        this.systemUtil = systemUtil;
        this.instances = instances;


        this.drawdown = 0;
        this.all_positions = 0;
        this.positive_positions = 0;
        this.negative_positions = 0;

        this.http_status = true;
        this.ws_status = false;
        this.trade_status = false;

        // this.max_position_profit = 0;
        // this.max_position_lose = 0;
        // this.min_position_profit = 0;
        // this.min_position_lose = 0;
        // this.average_position_profit = 0;
        // this.average_position_lose = 0;
    }

    start() {
        this.logger.debug('Monitoring module started...');

        const me = this;

        setInterval(() => {
            me.eventEmitter.emit('indicators', {
                http_status: me.http_status,
                ws_status: me.ws_status,
                trade_status: me.trade_status
            })
        }, 1000 * 3);

        setInterval(() => {
            me.eventEmitter.emit('trades', {
                positions: me.positionsStorage.all(),
                orders: me.ordersStorage.all(),
                pairs: me.instances.symbols.map(s => ({
                    exchange: s.exchange,
                    symbol: s.symbol
                }))
            })
        }, 1000 * 5);

        me.eventEmitter.on('ws_status', function(statusEvent) {
            if (statusEvent.status !== me.ws_status) {
                me.ws_status = statusEvent.status;
            }
        });

        me.eventEmitter.on('trade_status', function(statusEvent) {
            if (statusEvent.status !== me.trade_status) {
                me.trade_status = statusEvent.status;
            }
        });

    }
}