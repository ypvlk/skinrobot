
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


        this.balance = 0;
        // this.balance_with_comm = 0;
        this.commision_summary = 0; //тут я буду считтаь сколько всего отняла комиссия

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

        setInterval(() => {
            me.eventEmitter.emit('summary', {
                balance: this.balance,
                balance_with_comm: this.balance - this.commision_summary
            })
        }, 1000 * 1);

        me.eventEmitter.on('update_all_values', function() {
            me.updateAll();
        });

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



        me.eventEmitter.on('exchange_balance', function(balance) {
            balancesStorage.set(balance);
            me.balance = balance;
        });

        me.eventEmitter.on('exchange_order', function(orderEvent) {
            switch (orderEvent.getAction()) {
                case 'SAVE':
                    ordersStorage.set(orderEvent); //save at storage
                    return;
                case 'DELETE':
                    ordersStorage.del(orderEvent.getExchange(), orderEvent.getSymbol(), orderEvent.getOrder().getStatus()); //delete at storage
                    return;
                default:
                    me.logger.info(`Invalid exchange order event action: ${orderEvent.getAction()}`);
                    return;
            }
        });

        eventEmitter.on('exchange_position', function(positionEvent) {
            switch (positionEvent.getAction()) {
                case 'SAVE':
                    positionsStorage.set(positionEvent); //save at storage
                    return;
                case 'DELETE':
                    positionsStorage.del(positionEvent.getExchange(), positionEvent.getSymbol())//delete at storage
                    return;
                default:
                    me.logger.info(`Invalid exchange position event action: ${positionEvent.getAction()}`);
                    return;
            }
        });

    }

    //TODO
    //add save data into db
    updateAll() {
        this.logger.info('Monitoring params was updated.');

        return (
            this.drawdown = 0,
            this.all_positions = 0,
            this.positive_positions = 0,
            this.negative_positions = 0
        )
    }
}